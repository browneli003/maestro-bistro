// variable to hold databse connection
let db;
// establish connection to budget db set to version 1
const request = indexedDB.open('budget', 1);

// this event will be triggered if db version changes
request.onupgradeneeded = function (e) {
  // save ref to db
  const db = e.target.result;
  // object to store table called 'new_budget' set to autoincrement
  db.createObjectStore('new_tran', { autoIncrement: true });
};

// succesful connection
request.onsuccess = function (e) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = e.target.result;

  // check if online if so run uploadBudget() to send local bd data to api
  if (navigator.onLine) {
    // uploadTran();
  }
}

request.onerror = function (e) {
  console.log(e.target.errorCode);
};

// function executed if attempt to send data with no interet
function saveRecord(record) {
  // open new transaction with db with read write permissions
  const transaction = db.transaction(['new_tran'], 'readwrite');

  // access the object store from 'new_tran'
  const tranObjectStore = transaction.objectStore('new_tran');

  // add record to store
  tranObjectStore.add(record);
};

function uploadTran() {
  // open a transaction on your db
  const transaction = db.transaction(['new_tran'], 'readwrite');

  // access object store
  const tranObjectStore = transaction.objectStore('new_tran');

  // get records from store and set to var
  const getAll = tranObjectStore.getAll();

  // upon successful .getAll() execution run this function
  getAll.onsuccess = function () {
    // if data in indexedDB store send to api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_tran'], 'readwrite');
          // access the new_tran object
          const tranObjectStore = transaction.objectStore('new_tran');
          // clear all items in your store
          tranObjectStore.clear()

          alert('All saved transactions have been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
};

// listen for internet connection
window.addEventListener('online', uploadTran);