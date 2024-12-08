const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://neo4j:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password123'
  )
);

const connectNeo4j = async () => {
  try {
    await driver.verifyConnectivity();
    console.log('Conectado a Neo4j');
  } catch (error) {
    console.error('Error conectando a Neo4j:', error);
  }
};

module.exports = { driver, connectNeo4j };