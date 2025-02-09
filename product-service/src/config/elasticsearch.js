const { Client } = require('@elastic/elasticsearch');

// Create a client to connect to Elasticsearch
const client = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200', // Elasticsearch endpoint
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME,  // Optional authentication (if needed)
    password: process.env.ELASTICSEARCH_PASSWORD,
  },
});

module.exports = client;
