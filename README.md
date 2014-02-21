#Meraki Scraper

Scrape Meraki for the data you need

#Installation

*Easy as 1 2 3*

1. Install Dependencies `npm install`

2. Create Credentials file:
  * Duplicate `credentials.example.js` to `credentials.js`
  * replace the `merakiCredentials.email`, and `merakiCredentials.password` strings with the your Meraki credentials

3. Start CasperJS `npm start` and watch it loop through the clients in your Meraki instance


#Customization

The goal of the present script was to scrape Meraki to collect all the Mac Addresses of the computers in our domain and add them to our [Fog](http://www.fogproject.org/) inventory.

Read through the app.js file. Lines 60-100 utilize jQuery to scrape the data from each client page. Customize and change the data you collect as needed.

Lines 100-120 check for the vadality of the data and do something with that data. Easily a XHR request can send that data to a web service like exampled in the source. Or you can require a module like Mysql or Mongoose to store the data without a middle man.
