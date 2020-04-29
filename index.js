require('dotenv').config()

const fs = require('fs')
const https = require('https')
const crypto = require('crypto')
const request = require('request');

const urlGet = `${process.env.BASEURL}generate-data?token=${process.env.TOKEN}`
const urlPost = `${process.env.BASEURL}submit-solution?token=${process.env.TOKEN}`

let body = ''

function writeJSON(fileName, fileContent) {
  fs.writeFileSync(`${fileName}.json`, JSON.stringify(fileContent))
}

function startExercise() {
  https.get(urlGet, res => {
    res.setEncoding("utf8")
    res.on("data", data => {
      body += data
    })
    res.on("end", () => {
      body = JSON.parse(body)
      writeJSON('answer', body)
      decryptPhrase(body.cifrado, body.numero_casas)
      return body
    });
  });
}



function decryptPhrase(msg, key) {
  const num = key < 0 ? 26 : key
  let decoded = ''

  for (let j = 0; j < msg.length; j++) {
    const code = msg.charCodeAt(j)
    let letter = ''

    if (code >= 65 && code <= 90) {
      letter = String.fromCharCode((code - num) % 26)
    } else if (code >= 97 && code <= 122) {
      if (code - num < 97) {
        letter = String.fromCharCode(code - num + 122 - 97 + 1)
      } else {
        letter = String.fromCharCode(code - num)
      }
    } else {
      if (code === 32) {
        letter = ' '
      } else if (code === 58) {
        letter = String.fromCharCode(code)
      } else if (code === 46) {
        letter = String.fromCharCode(code)
      }
    }
    decoded += letter
  }

  body.decifrado = decoded
  writeJSON('answer', body)
  encriptyHash(decoded)
  return body
}

function encriptyHash(phrase) {
  body.resumo_criptografico = crypto.createHash('sha1').update(phrase).digest('hex')
  writeJSON('answer', body)
  sendExercise()
  return body
}

const sendExercise = async () => {
  const headers = {
    'Content-Type': 'multipart/form-data'
  }

  const send = request.post(
    { url: urlPost, headers },
    function optionalCallback(err, httpResponse, body) {
      if (err) {
        return console.error('upload fail!', err)
      }
      console.log('Upload success!', body)
    }
  )

  const form = send.form()
  form.append('answer', fs.createReadStream('./answer.json'), {
    filename: 'answer.json'
  })
}

startExercise()
