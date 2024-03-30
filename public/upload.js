;(function () {
  let droppedFile
  const onDrop = (dropEvent) => {
    dropEvent.preventDefault()
    let video
    if (dropEvent.dataTransfer) {
      video = dropEvent.dataTransfer.files[0]
    } else {
      video = dropEvent.target.files[0]
    }
    const { error, isValid } = validateVideo(video)
    if (isValid) {
      showInputs()
      // dataTransfer is for drag and drop
      if (dropEvent.dataTransfer) droppedFile = dropEvent.dataTransfer.files[0]
      // target files is for the selection
      else droppedFile = dropEvent.target.files[0]
    } else {
      alert(`${error}`)
      dropEvent.target.value = ''
    }
  }

  const showInputs = () => {
    const vidInputs = document.getElementById('vidInputs')
    const dropzone = document.getElementById('drop-zone')
    const modalBtn = document.getElementById('modalBtn')
    vidInputs.classList.add('visible')
    dropzone.classList.add('disable')
    modalBtn.removeAttribute('hidden')
  }

  const validateVideo = (videoObj) => {
    let error
    let isValid
    if (isValidVideoSize(videoObj)) {
      isValid = true
      error = ''
    } else {
      isValid = false
      error = `Video size exceeds the limit (10 MB). Choose a smaller file.`
    }
    return { error, isValid }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone')
    dropZone.addEventListener('drop', onDrop)
    dropZone.addEventListener('dragover', (e) => e.preventDefault())

    // assigning the button to the hidden input
    const uploadBtn = document.getElementById('video-upload-button')
    uploadBtn.addEventListener('click', (e) => {
      const fileInput = document.getElementById('uploadInput')
      e.preventDefault()
      fileInput.click()
    })

    // hidden input that holds video file
    const uploadInput = document.getElementById('uploadInput')
    uploadInput.addEventListener('change', onDrop)

    // check video width
    const width = document.getElementById('outputWidth')
    width.addEventListener('change', (e) => {
      const inputWidth = e.target.value
      if (isValidVidWidth(inputWidth)) {
        modalBtn.disabled = false
      }
    })

    const modalBtn = document.getElementById('modalBtn')
    modalBtn.addEventListener('click', triggerModal)

    const form = document.getElementById('uploadForm')
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      const {
        outputType: { value: outputType },
        outputWidth: { value: outputWidth },
      } = form

      const xhr = new XMLHttpRequest()
      xhr.timeout = 60000
      const progressBar = document.querySelector('progress')
      const log = document.querySelector('output')
      xhr.upload.addEventListener('loadstart', (event) => {
        progressBar.classList.add('visible')
        progressBar.value = 0
        progressBar.max = event.total
        log.textContent = 'Uploading (0%)…'
      })

      xhr.upload.addEventListener('progress', (event) => {
        progressBar.value = event.loaded
        log.textContent = `Uploading (${(
          (event.loaded / event.total) *
          100
        ).toFixed(2)}%)…`
      })

      xhr.upload.addEventListener('loadend', (event) => {
        progressBar.classList.remove('visible')
        if (event.loaded !== 0) {
          log.textContent = 'Upload finished.'
        }
      })

      // In case of an error, an abort, or a timeout, we hide the progress bar
      // Note that these events can be listened to on the xhr object too
      function errorAction(event) {
        progressBar.classList.remove('visible')
        log.textContent = `Upload failed: ${event.type}`
      }
      xhr.upload.addEventListener('error', errorAction)
      xhr.upload.addEventListener('abort', errorAction)
      xhr.upload.addEventListener('timeout', errorAction)

      // Build the payload
      const fileData = new FormData()
      const video = droppedFile
      fileData.append('video', video)
      fileData.append('outputType', outputType)
      fileData.append('outputWidth', outputWidth)

      // Theoretically, event listeners could be set after the open() call
      // but browsers are buggy here
      xhr.open('POST', '/uploadVideo', true)

      // Set up onload event listener
      xhr.onload = () => {
        if (xhr.status === 200) {
          // Parse JSON response
          const response = JSON.parse(xhr.responseText)
          // Get the link to the converted GIF
          const gifUrl = `/download/${response.filename}`

          setTimeout(() => {
            downloadLink = document.getElementById('download-link')
            downloadLink.setAttribute('href', gifUrl)
            downloadLink.style.display = 'block'
            document.getElementById('pre-download-text').style.display = 'none'
          }, 5000)
        } else {
          console.error('Upload failed with status:', xhr.status)
        }
      }

      // Note that the event listener must be set before sending (as it is a preflighted request)
      xhr.send(fileData)
    })
  })

  window.onclick = (event) => {
    const modal = document.getElementById('modal')
    if (event.target == modal) {
      modal.style.display = 'none'
    }
  }
  const triggerModal = (e) => {
    e.preventDefault()
    const modal = document.getElementById('modal')
    modal.style.display = 'block'

    const submitInput = document.getElementById('submitInput')
    submitInput.click()
  }
  const isValidVidWidth = (width) => {
    return width !== '' && width >= 10 && width <= 320
  }
  const isValidVideoSize = (video) => {
    const maxSize = 5 * 1024 * 1024 * 2
    const videoSize = video.size
    return videoSize <= maxSize
  }
})()
