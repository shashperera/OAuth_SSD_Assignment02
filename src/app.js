
const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser');

var var_arr = ['Extracting finished. Refresh the browser to see your Google events'];

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.render('index.html');
})

app.post('/', (req, res) => {
  const tkn = req.body.token;
  const fs = require('fs');
  const readline = require('readline');
  const { google } = require('googleapis');

  const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
  // The file token.json stores the user's access and refresh tokens, and is
  // created automatically when the authorization flow completes for the first
  // time.
  const TOKEN_PATH = 'token.json';

  // Get the client secrets from a local json file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), listEvents);
  });

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
  function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    oAuth2Client.getToken(tkn, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  }

  /**
   * Lists the next events on the user's primary calendar.
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  function listEvents(auth) {
    async function fun() {
      const calendar = await google.calendar({ version: 'v3', auth });
      calendar.events.list({
        calendarId: 'primary', //events created in primary calendar
        timeMin: (new Date()).toISOString(),
        maxResults: 30,
        singleEvents: true,
        orderBy: 'startTime',
      }, (err, res) => {
        if (err) return console.log('The API has returned an error: ' + err);
        const events = res.data.items;
        if (events.length) {
          console.log('These are your upcoming events:', events);
          events.map((event, i) => {
            var_arr.push(event);
          });
        } else {
          console.log('No upcoming events have been found.');
        }
      });
    }
    fun()
  }
  res.send(var_arr)
  res.render('index.html') //Render index page
});


app.post('/events', (req, res) => {
  // Require google from googleapis package.
  const { google } = require('googleapis')
  // Require oAuth2 from our google instance.
  const { OAuth2 } = google.auth

  // Create a new instance of oAuth and set our Client ID & Client Secret.
  const oAuth2Client = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET)

  // Set the refresh token after calling the setCredentials method on the oAuth2Client instance
  oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  })

  // Make a new google calender instance.
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

  // Creating start date
  const eventStartTime = new Date()
  eventStartTime.setDate(eventStartTime.getDay() + 2)

  // Creating a new event and date instances
  const eventEndTime = new Date()
  eventEndTime.setDate(eventEndTime.getDay() + 2)
  eventEndTime.setMinutes(eventEndTime.getMinutes() + 60)

  // event details 
  const event = {
    summary: `${req.body.summary}`,
    description: `${req.body.description}`,
    colorId: 6,
    start: {
      dateTime: eventStartTime,
    },
    end: {
      dateTime: eventEndTime,
    },
  }

  // The query to check whether the calendar is busy with events
  calendar.freebusy.query(
    {
      resource: {
        timeMin: eventStartTime,
        timeMax: eventEndTime,
        items: [{ id: 'primary' }],
      },
    },
    (err, res) => {
      // Log the errors in the busy query
      if (err) return console.error('Free Busy Query Error: ', err)

      // all events of the calendar at the time is stored in eventarr
      const eventArr = res.data.calendars.primary.busy

      // Checking whether eventarr is busy or not
      if (eventArr.length === 0) {
        // Create a new calendar event if not busy
        return calendar.events.insert(
          { calendarId: 'primary', resource: event },
          err => {
            // Send an error message if any error occurs
            if (err) return console.error('Error Creating Your Calender Event:', err)
            // Else send the successfull message 
            return console.log('Event has been created successfully.')
          })
      }
      // If event array is not empty log that we are busy.
      return console.log(`Sorry the schedule is busy for now`)
    }
  )
  console.log(req.body)
  // using Twiloio SendGrid's v3 Node.js Library
  // https://github.com/sendgrid/sendgrid-nodejs
  const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  const msg = {
    to: req.body.to, // the receipient
    from: 'it17097598@xx.xxx.com', // change to the verified sender
    subject: req.body.description, //the message body of the email invite
    text: req.body.description,
  }
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent')
    })
    .catch((error) => {
      console.error(error)
    })
  res.render('events.html')
})

app.listen(3000, () => {
  console.log('Server is running on port 3000') //server port
})
