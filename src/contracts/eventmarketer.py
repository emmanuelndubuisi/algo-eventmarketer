from pyteal import *


class Event:
    class Variables:
        name = Bytes("NAME")
        description = Bytes("DESCRIPTION")
        image = Bytes("IMAGE")
        amount = Bytes("AMOUNT")
        booked = Bytes("BOOKED") # boolean variable
        address = Bytes("ADDRESS")
        owner = Bytes("OWNER")
        bookedBy = Bytes("BOOKEDBY")
        customerAddress = Bytes("CUSTOMER")
        bookedTill = Bytes("BOOKEDTILL") # UNIX timestamp of the end of the booking

    class AppMethods:
        book = Bytes("book")
        sell = Bytes("sell")

    # allow users to create an Event application
    def application_creation(self):
        return Seq([
            Assert(
                # checks if input data in application_args do not contain empty values
                And(
                    Txn.application_args.length() == Int(5),
                    Txn.note() == Bytes("eventmarketer:uv1"),
                    Btoi(Txn.application_args[3]) > Int(0),
                    Len(Txn.application_args[0]) > Int(0),
                    Len(Txn.application_args[1]) > Int(0),
                    Len(Txn.application_args[2]) > Int(0),
                    Len(Txn.application_args[4]) > Int(0),
                )
            ),
            App.globalPut(self.Variables.name, Txn.application_args[0]),
            App.globalPut(self.Variables.description, Txn.application_args[1]),
            App.globalPut(self.Variables.image, Txn.application_args[2]),
            App.globalPut(self.Variables.amount, Btoi(Txn.application_args[3])),
            App.globalPut(self.Variables.booked, Int(0)),
            App.globalPut(self.Variables.address, Global.creator_address()),
            App.globalPut(self.Variables.owner, Txn.application_args[4]),
            App.globalPut(self.Variables.bookedBy, Bytes("")),
            App.globalPut(self.Variables.customerAddress, Bytes("")),
            App.globalPut(self.Variables.bookedTill, Int(0)),
            Approve()
        ])

    # allow users to book an event and become the new event owner
    def bookEvent(self):
        return Seq([
            Assert(
                # checks if event is available to be booked
                # checks if sender is not the event's owner
                And(
                    Global.group_size() == Int(2),
                    Txn.application_args.length() == Int(3),
                    App.globalGet(self.Variables.booked) == Int(0),
                    App.globalGet(self.Variables.address) != Txn.sender(),
                    Len(Txn.application_args[1]) > Int(0),
                    Btoi(Txn.application_args[2]) > Txn.first_valid_time(),
                ),
            ),
            Assert(
                And(
                    Gtxn[1].type_enum() == TxnType.Payment,
                    Gtxn[1].receiver() == App.globalGet(
                        self.Variables.address),
                    Gtxn[1].amount() == App.globalGet(self.Variables.amount),
                    Gtxn[1].sender() == Gtxn[0].sender(),
                )
            ),

            App.globalPut(self.Variables.bookedBy, Txn.application_args[1]),
            App.globalPut(self.Variables.customerAddress, Gtxn[1].sender()),
            App.globalPut(self.Variables.booked, Int(1)),
            App.globalPut(self.Variables.bookedTill, Btoi(Txn.application_args[2])),
            Approve()
        ])
    # allow the current customer of the event or the event's owner to end the booking
    def endBooking(self):
        Assert(
            # checks if the current timestamp is greater than the bookedTill value
            # checks if sender is the owner or the customer
            And(
                Txn.application_args.length() == Int(2),
                App.globalGet(self.Variables.booked) == Int(1),
                Txn.first_valid_time() > App.globalGet(self.Variables.bookedTill),
            ),
            Or(
                And(
                    App.globalGet(
                    self.Variables.owner) == Txn.application_args[1],
                    App.globalGet(self.Variables.address) == Txn.sender(),
                ),
                And(
                    App.globalGet(
                    self.Variables.bookedBy) == Txn.application_args[1],
                    App.globalGet(self.Variables.customerAddress) == Txn.sender(),
                )
            )
        )
        return Seq([
            App.globalPut(self.Variables.booked, Int(0)),
            App.globalPut(self.Variables.bookedTill, Int(0)),
            App.globalPut(self.Variables.customerAddress, Bytes("")),
            App.globalPut(self.Variables.bookedBy, Bytes("")),
            Approve()
        ])

    def application_deletion(self):
        return Return(Txn.sender() == Global.creator_address())

    def application_start(self):
        return Cond(
            [Txn.application_id() == Int(0), self.application_creation()],
            [Txn.on_completion() == OnComplete.DeleteApplication,
             self.application_deletion()],
            [Txn.application_args[0] == self.AppMethods.book, self.bookEvent()],
            [Txn.application_args[0] == self.AppMethods.sell, self.endBooking()],
        )

    def approval_program(self):
        return self.application_start()

    def clear_program(self):
        return Return(Int(1))

