$(function () {
  var mensajes = []
  var usuarioID, nombre, con
  var plantilla = Handlebars.compile($('#plantilla').html())
  var peer = new Peer({
    host: 'localhost',
    port: 9000,
    path: '/peerjs',
    debug: 3,
    config: {
      'iceServers': [{
        url: 'stun:stun1.l.google.com:19302'
      },
        {
          url: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
        }
      ]
    }
  })

// Al abrir la conexion se muestra el id del peer
  peer.on('open', function () {
    $('#id').text(peer.id)
  })

// Para tener acceso al audio y video
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

// Video y audio
  function video (callback) {
    navigator.getUserMedia({
      audio: true,
      video: true
    }, callback, function (error) {
      console.log(error)
      console.log('Ha ocurrido un problema. Prueba de nuevo')
    })
  }
// Obtener video de la camara local
  video(function (stream) {
    window.localStream = stream
    streamRecibido(stream, 'mi-camara')
  })

// Obtener video
  function streamRecibido (stream, elemento) {
    var video = $('#' + elemento + ' video')[0]
    video.src = window.URL.createObjectURL(stream)
    window.peerStream = stream
  }

// Formulario de login
  $('#login').click(function () {
    nombre = $('#nombre').val()
    usuarioID = $('#usuarioID').val()
    if (usuarioID) {
      con = peer.connect(usuarioID, {
        metadata: {
          'username': nombre
        }
      })
      con.on('data', handlerMensaje)
    }

    $('#chat').removeClass('hidden')
    $('#conectar').addClass('hidden')
  })

// Conectarse con el otro usario
  peer.on('connection', function (conexion) {
    con = conexion
    usuarioID = conexion.peer
    con.on('data', handlerMensaje)

    $('#usuarioID').addClass('hidden').val(usuarioID)
    $('#peerConectado').removeClass('hidden')
    $('#conectado').text(conexion.metadata.username)
  })

// Mensaje recibido es agregado al plantilla
  function handlerMensaje (data) {
    mensajes.push(data)
    var html = plantilla({
      'mensajes': mensajes
    })
    $('#mensajes').html(html)
  }

// Al dar enter se manda a llamar esta función
  function enviarMensaje () {
    var texto = $('#mensaje').val()
    var data = {
      'desde': nombre,
      'texto': texto
    }
    con.send(data)
    handlerMensaje(data)
    $('#mensaje').val('')
  }

// Acción de presionar Enter
  $('#mensaje').keypress(function (e) {
    if (e.which === 13) {
      enviarMensaje()
    }
  })

// Acción de dar clic en 'Enviar'
  $('#enviar').click(enviarMensaje)

// Acción de dar clic a 'Videollamada'
  $('#videollamada').click(function () {
    var call = peer.call(usuarioID, window.localStream)
    call.on('stream', function (stream) {
      window.peerStream = stream
      streamRecibido(stream, 'camara-remota')
    })
  })

// Realización de una call
  peer.on('call', function (call) {
    videoLlamada(call)
  })

// Función que inicia la call
  function videoLlamada (call) {
    call.answer(window.localStream)
    call.on('stream', function (stream) {
      window.peerStream = stream
      streamRecibido(stream, 'camara-remota')
    })
  }
})
