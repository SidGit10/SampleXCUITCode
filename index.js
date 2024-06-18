var axios = require('axios');
const fs = require('fs');

var buildID = process.env.BROWSERSTACK_BUILD_NAME // Get this from pipeline
buildID = "browserstack build 70"
var BROWSERSTACK_USERNAME = process.env.BROWSERSTACK_USERNAME // Get this from pipeline
var BROWSERSTACK_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY // Get this from pipeline
var hashedId = ""

var product = "app-automate" // Get this from pipeline

var configbuilds = {
    method: 'get',
    url: 'https://api.browserstack.com/' + product + '/builds.json',
    auth: {
        username: BROWSERSTACK_USERNAME,
        password: BROWSERSTACK_ACCESS_KEY
    },
};

var configsessions = {
    method: 'get',
    url: 'https://api.browserstack.com/' + product + '/builds/<build-id>/sessions.json',
    auth: {
        username: process.env.BROWSERSTACK_USERNAME || 'BROWSERSTACK_USERNAME',
        password: process.env.BROWSERSTACK_ACCESS_KEY || 'BROWSERSTACK_ACCESS_KEY'
    },
};

axios(configbuilds)
    .then(function (response) {
        var data = response.data;
        hashedId = findHashedIdByName(data, buildID);
        // console.log(hashedId)
        var configsessions = {
            method: 'get',
            url: 'https://api.browserstack.com/' + product + '/builds/' + hashedId + '/sessions.json',
            auth: {
                username: BROWSERSTACK_USERNAME,
                password: BROWSERSTACK_ACCESS_KEY
            },
        };
        axios(configsessions)
            .then(function (response) {
                var allSessions = response.data;
                // console.log(allSessions);
                const extractedData = allSessions.map(session => {
                    const { name, os, os_version, browser_version, browser, device, status, public_url } = session.automation_session;
                    return { name, os, os_version, browser_version, browser, device, status, public_url };
                });

                // console.log(extractedData)
                if (product == 'automate') {
                    const AuthtmlTable = `
                        <table border="1">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>OS</th>
                                <th>OS Version</th>
                                <th>Browser Version</th>
                                <th>Browser</th>
                                <th>Device</th>
                                <th>Status</th>
                                <th>Public URL</th>
                            </tr>
                            </thead>
                            <tbody>
                            ${extractedData.map(session => `
                                <tr>
                                <td>${session.name}</td>
                                <td>${session.os}</td>
                                <td>${session.os_version}</td>
                                <td>${session.browser_version}</td>
                                <td>${session.browser}</td>
                                <td>${session.device}</td>
                                <td>${session.status}</td>
                                <td><a href="${session.public_url}" target="_blank">Click Here</a></td>
                                </tr>
                            `).join('')}
                            </tbody>
                        </table>
                        `;

                    fs.writeFileSync('output.html', AuthtmlTable);
                }
                else {

                    const AAhtmlTable = `
                        <table border="1">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>OS</th>
                                <th>OS Version</th>
                                <th>Device</th>
                                <th>Status</th>
                                <th>Public URL</th>
                            </tr>
                            </thead>
                            <tbody>
                            ${extractedData.map(session => `
                                <tr>
                                <td>${session.name}</td>
                                <td>${session.os}</td>
                                <td>${session.os_version}</td>
                                <td>${session.device}</td>
                                <td>${session.status}</td>
                                <td><a href="${session.public_url}" target="_blank">Click Here</a></td>
                                </tr>
                            `).join('')}
                            </tbody>
                        </table>
                        `;

                    fs.writeFileSync('output.html', AAhtmlTable);
                }
            })
            .catch(function (error) {
                console.log(error);
            });

            
    })
    .catch(function (error) {
        console.log(error);
    });


function findHashedIdByName(data, searchName) {
    const result = data.find(item => item.automation_build.name === searchName);
    return result ? result.automation_build.hashed_id : null;
}
