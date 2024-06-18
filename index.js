var axios = require('axios');
const fs = require('fs');

var buildID = process.env.BROWSERSTACK_BUILD_NAME;
var BROWSERSTACK_USERNAME = process.env.BROWSERSTACK_USERNAME;
var BROWSERSTACK_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;
var product = "app-automate";

var configbuilds = {
    method: 'get',
    url: 'https://api.browserstack.com/' + product + '/builds.json',
    auth: {
        username: BROWSERSTACK_USERNAME,
        password: BROWSERSTACK_ACCESS_KEY
    },
};

axios(configbuilds)
    .then(function (response) {
        var data = response.data;
        var hashedId = findHashedIdByName(data, buildID);
        if (!hashedId) {
            throw new Error('Build ID not found or invalid.');
        }

        var configsessions = {
            method: 'get',
            url: 'https://api.browserstack.com/' + product + '/builds/' + hashedId + '/sessions.json',
            auth: {
                username: BROWSERSTACK_USERNAME,
                password: BROWSERSTACK_ACCESS_KEY
            },
        };

        return axios(configsessions);
    })
    .then(function (response) {
        var allSessions = response.data;
        const extractedData = allSessions.map(session => {
            const { name, os, os_version, browser_version, browser, device, status, public_url } = session.automation_session;
            return { name, os, os_version, browser_version, browser, device, status, public_url };
        });

        var htmlTable = generateHTMLTable(extractedData, product);
        fs.writeFileSync('output.html', htmlTable);
        console.log('HTML report generated successfully.');
    })
    .catch(function (error) {
        console.error('Error:', error.message);
    });

function findHashedIdByName(data, searchName) {
    const result = data.find(item => item.automation_build.name === searchName);
    return result ? result.automation_build.hashed_id : null;
}

function generateHTMLTable(data, product) {
    var htmlTable = '';
    if (product === 'automate') {
        htmlTable = `
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
                    ${data.map(session => `
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
            </table>`;
    } else {
        htmlTable = `
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
                    ${data.map(session => `
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
            </table>`;
    }
    return htmlTable;
}
