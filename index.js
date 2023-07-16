const express = require('express');
const cors  =require('cors');
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');
const serviceAccountKey = JSON.parse(process.env.UNI_DOMAIN)
// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

const app = express();
app.use(cors(
));

app.get('/collections', async (req, res) => {
  try {
    const db = admin.firestore();
    const collections = await db.listCollections();
    const collectionIds = collections.map((collection) => collection.id);
    const sortedCollectionIds = collectionIds.sort();
    res.json(sortedCollectionIds);
  } catch (error) {
    console.error('Error retrieving collection IDs:', error);
    res.status(500).json({ error: 'Failed to retrieve collection IDs' });
  }
});

app.get('/percentage', async (req, res) => {
  const db = admin.firestore();
  try {
    const { documentId } = req.query;

    if (!documentId) {
      return res.status(400).json({ error: 'Missing document ID' });
    }
    const collections = await db.listCollections();
    let totalStates = 0;
    let presentarray = Array(59).fill(0);
    let precentarray = Array(59).fill(0);
   
    const fetchDocuments = collections.map(async (collection) => {
      const snapshot = await collection.doc(documentId).get();
      if (snapshot.exists) {
        totalStates++;
        const data = snapshot.data();
        const sortedEntries = Object.entries(data).sort();
        const sortedData = Object.fromEntries(sortedEntries);
        console.log(sortedData);
        const values = Object.values(sortedData);

        for(i=0;i<values.length;i++) {

        if (values[i] === 'present') {
          presentarray[i]=presentarray[i]+1;
        }
      }
    }
    });

    await Promise.all(fetchDocuments);


    for(i=0;i<presentarray.length;i++) {
       precentarray[i] = (presentarray[i] / totalStates) * 100;
    }

    res.json({ precentarray });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'An error occurred while fetching the data' });
  }
});


const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
