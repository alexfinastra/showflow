/* Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved. */
/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * NAME
 *   select1.js
 *
 * DESCRIPTION
 *   Executes a basic query without using a connection pool or ResultSet.
 *   Uses Oracle's sample HR schema.
 *
 *   Scripts to create the HR schema can be found at:
 *   https://github.com/oracle/db-sample-schemas
 *
 *   For a connection pool example see webapp.js
 *   For a ResultSet example see resultset2.js
 *   For a query stream example see selectstream.js
 *   For a Promise example see promises.js
 *
 *****************************************************************************/

var oracledb = require('oracledb');

oracledb.getConnection(
  {
    user          : "GPP46",
    password      : "GPP46",
    connectString : "GPP12C"
  },
  function(err, connection)
  {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log('Connection was successful!');

    connection.close(
      function(err)
      {
        if (err) {
          console.error(err.message);
          return;
        }
      });
  });

