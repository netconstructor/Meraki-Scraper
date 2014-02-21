
//Load the credentials file
var fs = require('fs'); eval(fs.read('credentials.js')+'');

//Create casper instance
var casper = require('casper').create({
    clientScripts:  [
        'node_modules/jquery/lib/node-jquery.js',      // These two scripts will be injected in remote
        'node_modules/lodash/dist/lodash.min.js'  // DOM on every request
    ],
    pageSettings: {
        loadImages:  false, // The WebPage instance used by Casper will
        loadPlugins: false  // use these settings
    },
    waitTimeout: 200000 //Set a long timeout because sometimes Meraki's interface take a while to render
});


//Log into meraki
casper.start('https://account.meraki.com/secure/login/dashboard_login', function() {
    this.echo(this.getTitle()); //Just log the page title

    this.fill('form', {
        'email':    merakiCredentials.email,   //From credentials.js
        'password': merakiCredentials.password //From credentials.js
    }, true);
});


//Then commence the scraping
casper.then(function() {
    //Grab the number of clients
    var numberOfClients = this.evaluate(function() {
        return $('.search_count b').html();
    });

    //Echo the number of clients with a pretty color
    this.echo(numberOfClients, "INFO");

    //Click on the first Client in the client list table
    this.click('tr.ftp0');

    //Just make sure we get to the right URL
    this.echo(this.getCurrentUrl());

    //Save this
    var view = this;
    //Start counting what client we are at (We can't use i because for loop finished before the first wait is loaded)
    var thisindex = 0;
    //Go until we get the number of clients
    for (var i = 0; i < parseInt(numberOfClients) + 1; i++) {
        //Wait for the next button to show up (Meaning the page is fully rendered)
        casper.waitForSelector('a[id="next_ap"] a', function() {
            //Keep waiting, lets make sure the page is ACTUALLY fully rendered
            casper.waitForSelector('.pcc_confirm', function(){
                thisindex ++;
                view.echo("--------------------------------  " + thisindex + " / " + numberOfClients); //Just for visual apeal
                
                try {
                    //Grab the name of the computer
                    var name = view.evaluate(function() {
                        return $('.s3name').html();
                    });

                    //Grab the IP address of the computer
                    var ipAddress = view.evaluate(function() {
                        var address;
                        //Loop throuh each mac address (most have mac addresses for each network device) and find the one with an IP address
                        $('td.ft.mac').each(function(i){
                            if ($(this).next().html().length > 0) {
                                address = $(this).siblings('td.ft.ip').html();
                            }
                        });

                        return address;
                    });


                    //Get the mac address in a similar way.
                    var macAddress = view.evaluate(function() {
                        var address;

                        $('td.ft.mac').each(function(i){
                            if ($(this).next().html().length > 0) {
                                address = $(this).html();
                                ipAddress = $(this).siblings('td.ft.ip').html();
                            }
                        });

                        return address;
                    });

                    //Find the serial number
                    var serial = view.evaluate(function(){
                        return $("td:contains('Serial:')").siblings('.s3v').html()
                    });



                    //Only do something with the data, if we have the mac address
                    if (macAddress) {
                        //Make sure we have a good URL
                        view.echo(view.getCurrentUrl());
                        //Make it clear that we found a mac address with pretty text
                        view.echo(macAddress, "INFO");


                        //Here is where we do something with the data scraped. Replace this with whatever you want (I.E require mysql or mongoose and insert it into a database)
                        var xhr = new XMLHttpRequest();
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState == 4) {
                                view.echo(xhr.responseText);
                            }
                        };
                        //post it to our fog server (Not a valid URL...) Just an example
                        var params = "mac=" + btoa("HWaddr" + macAddress).replace("=","") + "&host=" + btoa(name).replace("=","") + "&ip=" + btoa(ipAddress).replace("=","") + "&serial=" + serial + "&advanced=1&imageid="+btoa("1")+"&osid=" + btoa("50");
                        view.echo(params);
                        xhr.open("POST", "http://service-collecting-data.yourdomain.com/fog/service/auto.register.php?" + params, true);
                        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                        //xhr.send(params);
                    }

                    //Log the other information if present
                    if (ipAddress) {
                        view.echo(ipAddress);
                    }

                    if (name) {
                        view.echo(name);
                    }

                    if (serial) {
                        view.echo(serial);
                    }
                } catch (err) {
                    view.echo(err);
                }

                //Go on to the next Meraki record
                view.click('a[id="next_ap"] a');
            });
        });
    }
});


//Check to see if you created the credentials file
if (!merakiCredentials.email) {
    console.log("\033[31m You need to set your credentials in crentials.js first!");
    console.log("\033[0m(email and password required)");
    casper.exit();
} else {
    console.log("\033[32m Credentials Found!\033[0m Starting the script. This will take a while, please wait.");
    casper.run();
}

