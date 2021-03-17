const puppeteer = require('puppeteer')
const nodemailer = require('nodemailer')
const opn = require('opn')

let sitesAndKeywords = [
  {
    url: 'https://some-url.com',
    keywordToChange: /not in stock/i
  }
]

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const sendEmail = url => {
  return nodemailer
    .createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-password'
      }
    })
    .sendMail({
      from: 'your-email@gmail.com',
      to: 'your-email@outlook.com',
      subject: 'The hype is real',
      text: url
    })
    .catch(console.log)
}

const main = async () => {
  if (sitesAndKeywords.length === 0) {
    console.log('ran out of sites')
    process.exit(0)
  }

  try {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    for (const site of sitesAndKeywords) {
      try {
        await page.goto(site.url)
        await sleep(4000)
        const bodyHandle = await page.$('body')
        const html = await page.evaluate(body => body.innerHTML, bodyHandle)
        const match = html.match(site.keywordToChange)

        if (!match) {
          console.log('Hype!')
          opn(site.url)
          await sendEmail(site.url)
          // remove site to avoid continous spam
          sitesAndKeywords = sitesAndKeywords.filter(i => i.url !== site.url)
        }
      } catch (error) {
        console.log('Caught error. Continuing...', error, site.url)
      }
    }

    console.log('Finished run. Starting over in a little while.')

    await browser.close()
    // vary time before restart due to DOS protection
    await sleep(Math.floor(Math.random() * 100000 + 30000))
    main()
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

main()

