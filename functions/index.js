const functions = require('firebase-functions')
const gcs  = require('@google-cloud/storage')()
const spawn  = require('child-process-promise').spawn

exports.generateThumbnail = functions.storage.object()
  .onChange(event => {
    const object = event.data
    const filePath = object.name
    const fileName = filePath.split('/').pop()
    const fileBucket = object.bucket
    const bucket = gcs.bucket(fileBucket)
    const tempFilePath = `/tmp/${fileName}`

    if (fileName.startsWith('thumb_')) {
      console.log('Already a thumbnail.')
      return
    }

    if (!object.contentType.startsWith('image/')) {
      console.log('This is not an image.')
      return
    }

    if (object.resourceState === 'not_exists') {
      console.log('This is a deletion event')
      return
    }

    return bucket.file(filePath).download({
      destination: tempFilePath
    })
    .then(() => {
      console.log('image downloaded locally to', tempFilePath)
      return spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath])
    })
    .then(() => {
      console.log('thumbnail created')
      // match end of string that contains a slash followed by 0 or more characters that are not a slash:
      const thumbFilePath = filePath.replace(/(\/)?([^\/]*)*/, '$1thumb_$2')

      return bucket.upload(tempFilePath, {
        destination: thumbFilePath
      })
    })


  })




// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Howdy from Firebase!");
// });
