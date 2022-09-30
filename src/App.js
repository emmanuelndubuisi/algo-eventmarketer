import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';
import { indexerClient, myAlgoConnect } from "./utils/constants";
import { stringToMicroAlgos, microAlgosToString } from './utils/conversions';
import { bookEventAction, createEventAction, deleteTicketAction, getEventsAction, sellTicketAction } from './utils/marketplace';

function App() {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [balance, setBalance] = useState("")
  const [address, setAddress] = useState("")

  const fetchBalance = async (accountAddress) => {
    indexerClient.lookupAccountByID(accountAddress).do()
      .then(response => {
        const _balance = response.account.amount;
        setBalance(_balance);
      })
      .catch(error => {
        console.log(error);
      });
  };

  const connectWallet = async () => {
    myAlgoConnect.connect()
      .then(accounts => {
        const _account = accounts[0];
        console.log(_account)
        setAddress(_account.address);
        fetchBalance(_account.address);
        if (_account.address) getEvents(_account.address);
      }).catch(error => {
        console.log('Could not connect to MyAlgo wallet');
        console.error(error);
      })
  };

  useEffect(() => {
    connectWallet()
  }, [])


  const formSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!name || !amount || !description || !image) return;
      await createEventAction(address, { name, amount: stringToMicroAlgos(amount), description, image })
      getEvents();
    } catch (error) {
      console.log(error);
    }
  };

  const getEvents = async (_address) => {
    try {
      alert("fetching events")
      const events = await getEventsAction();
      setEvents(events);
    } catch (error) {
      alert(error)
      console.log(error);
    }

  };

  const bookEvent = (event) => {
    bookEventAction(address, event)
      .then(() => {
        getEvents(address);
        fetchBalance(address);
      })
      .catch(error => {
        console.log(error)
      })
  }

  const sellEventTicket = (event) => {
    sellTicketAction(address, event)
      .then(() => {
        getEvents(address);
        fetchBalance(address);
      })
      .catch(error => {
        console.log(error)
      })
  }

  const deleteTicket = (id)=>{
    deleteTicketAction(address, id)
      .then(() => {
        getEvents(address);
        fetchBalance(address);
      })
      .catch(error => {
        console.log(error)
      })
  }

  return (
    <>
      <div>
        <header className="site-header sticky-top py-1">
          <nav className="container d-flex flex-column flex-md-row justify-content-between">
            <a className="py-2" style={{ color: "white" }} href="#">
              <h3>Event Market</h3>
            </a>
            <a className="py-2 d-none d-md-inline-block" href="#">
              Balance: {microAlgosToString(balance)} ALGO
            </a>
          </nav>
        </header>
        <main>
          <div className="row row-cols-1 row-cols-md-3 mb-3 text-center">
            {events.map(event => <div className="col">
              <div className="card mb-4 rounded-3 shadow-sm">
                <div className="card-header py-3">
                  <h4 className="my-0 fw-bold">{event.name}</h4>
                </div>
                <div className="card-body">
                  <h1 className="card-title pricing-card-title">{microAlgosToString(event.amount)}<small className="text-muted fw-light">ALGO</small></h1>
                  <img width={200} src={event.image} alt="" />
                  <p className="list-unstyled mt-3 mb-4">
                    {event.description}
                  </p>
                  {!event.booked ? <button type="button" onClick={() => bookEvent(event)} className="w-100 btn btn-lg btn-primary">Book Event</button>
                    : event.owner === address ?
                      <div className = "w-100">
                        <button type="button" onClick={() => sellEventTicket(event)} style = {{width: "80%"}} className="btn btn-lg btn-outline-danger">Sell Slot</button>
                        <button type="reset" onClick={() => deleteTicket(event.appId)} className="btn btn-lg btn-outline-danger"><i class="bi bi-trash"></i></button>
                        </div>
                      : <p> Ticket has already been bought</p>}
                </div>
              </div>
            </div>)}
          </div>
        </main>


        <div className="p-3 w-50 justify-content-center">
          <h2>Create Event</h2>
          <div className="">
            <form onSubmit={formSubmit}>
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control rounded-4"
                  id="floatingInput"
                  placeholder="Name"
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <label htmlFor="floatingInput">Name</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control rounded-4"
                  id="floatingInput"
                  placeholder="Amount"
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <label htmlFor="floatingInput">Amount</label>
              </div>
              <div className="form-floating mb-3">
                <textarea
                  className="form-control rounded-4"
                  id="floatingInput"
                  placeholder="Description"
                  rows={5}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <label htmlFor="floatingInput">Description</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  className="form-control rounded-4"
                  id="floatingInput"
                  placeholder="Image Url"
                  onChange={(e) => setImage(e.target.value)}
                  required
                />
                <label htmlFor="floatingInput">Image</label>
              </div>

              <button
                className="w-100 mb-2 btn  rounded-4 btn-primary"
                type="submit"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
