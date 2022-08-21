const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log(`Server Running at http://localhost:3000/`)
    );
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateDBObjectToResponseObject = (DbObject) => {
  return {
    stateId: DbObject.state_id,
    stateName: DbObject.state_name,
    population: DbObject.population,
  };
};

const convertDistrictDBObjectToResponseObject = (DbObject) => {
  return {
    districtId: DbObject.district_id,
    districtName: DbObject.district_name,
    stateId: DbObject.state_id,
    cases: DbObject.cases,
    cured: DbObject.cured,
    active: DbObject.active,
    deaths: DbObject.deaths,
  };
};

//get all the state details

app.get("/states/", async (request, response) => {
  const allStateDetails = `SELECT * FROM state;`;
  const stateDetails = await db.all(allStateDetails);
  response.send(
    stateDetails.map((eachState) =>
      convertStateDBObjectToResponseObject(eachState)
    )
  );
});

//get state details based upon the stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const allStateDetails = `SELECT * FROM state WHERE state_id='${stateId}';`;
  const stateDetails = await db.get(allStateDetails);
  response.send(convertStateDBObjectToResponseObject(stateDetails));
});

//inserting the district details

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const creatingDistrictDetails = `INSERT INTO district
(district_name,state_id,cases,cured,active,deaths)
VALUES ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  await db.run(creatingDistrictDetails);
  response.send("District Successfully Added");
});

//getting district details based upon the districtId

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = `SELECT * FROM district WHERE district_id='${districtId}';`;
  const result = await db.get(districtDetails);
  response.send(convertDistrictDBObjectToResponseObject(result));
});

//deleting the district details based upon the district id

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = `DELETE FROM district WHERE district_id='${districtId}';`;
  const result = await db.run(districtDetails);
  response.send("District Removed");
});

//updating the details of specific district

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updatingDistrictDetails = `UPDATE district 
                                    SET 
                                    district_name='${districtName}',
                                    state_id='${stateId}',
                                    cases='${cases}',
                                    cured='${cured}',
                                    active='${active}',
                                    deaths='${deaths}'
                                    WHERE district_id='${districtId}';`;
  await db.run(updatingDistrictDetails);
  response.send("District Details Updated");
});

//stats of cases,cured,active,death

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsDetails = `SELECT 
                            SUM(cases) as totalCases,
                            SUM(cured) as totalCured,
                            SUM(active) as totalActive,
                            SUM(deaths) as totalDeaths
                            FROM district INNER JOIN state ON district.state_id=state.state_id 
                            WHERE state_id='${stateId}'`;
  const result = await db.get(statsDetails);
  response.send(convertDistrictDBObjectToResponseObject(result));
});

//get state name based upon the district id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const toGetStateName = `SELECT state_name FROM state INNER JOIN district 
ON state.state_id=district.state_id
WHERE district_id='${districtId}';`;
  const result = await db.get(toGetStateName);
  response.send(convertStateDBObjectToResponseObject(result));
});
module.exports = app;
