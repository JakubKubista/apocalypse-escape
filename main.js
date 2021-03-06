require([
	'bower_components/threex.md2character/package.require.js',
	'bower_components/threex.crates/package.require.js',
	'bower_components/threex.environment/package.require.js',
	'bower_components/webaudiox/build/webaudiox.js'
], function(){
	// detect WebGL
	if( !Detector.webgl ){
		Detector.addGetWebGLMessage();
		throw 'WebGL Not Available'
	}
	// setup webgl renderer full page
	var renderer	= new THREE.WebGLRenderer( { antialias: true } );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	// setup a scene and camera
	var scene	= new THREE.Scene();
	var camera	= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
	// declare the rendering loop
	var onRenderFcts= [];
	// handle window resize events
	var winResize	= new THREEx.WindowResize(renderer, camera)
	// declare the score
	var score = 0
	// declare the health
	var health = 3
	// game state
	var catched = false
	var killed = false
	var playMusic = false
	var musicNumber = 1

	//////////////////////////////////////////////////////////////////////////////////
	//		default 3 points lightning					//
	//////////////////////////////////////////////////////////////////////////////////
	var ambientLight= new THREE.AmbientLight( 0x020202 )
	scene.add( ambientLight)

	var frontLight	= new THREE.DirectionalLight('white', 1)
	frontLight.position.set(0.5, 0.5, 0.5)
	frontLight.castShadow = true
	frontLight.shadowCameraVisible = true
	scene.add( frontLight )

	var backLight	= new THREE.DirectionalLight('white', 0.5)
	backLight.position.set(-0.5, -0.5, -0.5)
	scene.add( backLight )

	frontLight.shadowMapSize = new THREE.Vector2( 512, 512 )
	frontLight.shadowCamera = new THREE.OrthographicCamera( 5, 5, 0, 0, 0.5, 500 )

	/*
	var pointLight	= new THREE.SpotLight('white', 0.1)
	pointLight.position.set(0,5,5)
	scene.add( pointLight )

	var blackLight	= new THREE.DirectionalLight('black', 1)
	blackLight.position.set(0, 1, 0)
	scene.add( blackLight )
	*/

		//////////////////////////////////////////////////////////////////////////////////
		//		Init sound	- libs/audio.js					//
		//////////////////////////////////////////////////////////////////////////////////
		var context = new AudioContext()
		var lineOut = new WebAudiox.LineOut(context)
		lineOut.volume = 0.2

		// load buffers
		WebAudiox.loadBuffer(context, getGoodSoundUrl(), function(buffer){
			setGoodSoundBuffer(buffer)
		})
		WebAudiox.loadBuffer(context, getBadSoundUrl(), function(buffer){
			setBadSoundBuffer(buffer)
		})
		WebAudiox.loadBuffer(context, getCatchedSoundUrl(), function(buffer){
			setCatchedSoundBuffer(buffer)
		})
		WebAudiox.loadBuffer(context, getMusic1Url(), function(buffer){
			setMusic1Buffer(buffer)
		})
		WebAudiox.loadBuffer(context, getMusic2Url(), function(buffer){
			setMusic2Buffer(buffer)
		})
		WebAudiox.loadBuffer(context, getMusic3Url(), function(buffer){
			setMusic3Buffer(buffer)
		})

		// play function
		function playSound(type){
			if(type=="good") soundBuffer = getGoodSoundBuffer()
			if(type=="bad") soundBuffer = getBadSoundBuffer()
			if(type=="catched") soundBuffer = getCatchedSoundBuffer()
			if(type=="music1") soundBuffer = getMusic1Buffer()
			if(type=="music2") soundBuffer = getMusic2Buffer()
			if(type=="music3") soundBuffer = getMusic3Buffer()
			if (!soundBuffer) return
			var source = context.createBufferSource()
			source.buffer = soundBuffer
			source.connect(lineOut.destination)
			source.start(0)
			return source
		}

		//////////////////////////////////////////////////////////////////////////////////
		//		Init city (background)						//
		//////////////////////////////////////////////////////////////////////////////////
		var city = THREEx.Environment.city()
		scene.add(city)
		city.position.add(new THREE.Vector3(-20, 25, 0))
		onRenderFcts.push(function(delta, now){
			city.position.z = mainCharacter.character.object3d.position.z
		})

		//////////////////////////////////////////////////////////////////////////////////
		//		Create main character model 						//
		//////////////////////////////////////////////////////////////////////////////////
		var mainCharacter =  new THREEx.MD2CharacterRatmahatta()
		scene.add(mainCharacter.character.object3d)
		onRenderFcts.push(function(delta){
			mainCharacter.update(delta)
		})
		// Setup character model
		var defaultPosition = defaultValuesMainCharacter(mainCharacter)
		// controls.input based on keyboard (libs/main.character.js)
		setMainCharacterControl(mainCharacter)

		//////////////////////////////////////////////////////////////////////////////////
		//		Init road (floor)					//
		//////////////////////////////////////////////////////////////////////////////////
		function generateRoad(z){
			var road = THREEx.Environment.road()
			if(getChangedStage()){
				setStartStage(z)
				setChangedStage(false)
			}
			road.receiveShadow =  true
			scene.add(road)
			var velocity	= new THREE.Vector3(0, 0, z);
			road.position.add(velocity)
			road.rotation.x = -1.57
		}

		//generating next road
		generateRoad(mainCharacter.character.object3d.position.z-35)
		generateRoad(mainCharacter.character.object3d.position.z+5)
	  var roadScale = 0
		onRenderFcts.push(function(delta, now){
			if(roadScale<mainCharacter.character.object3d.position.z){
				generateRoad(mainCharacter.character.object3d.position.z+38)
				roadScale+=38
			}
		})

		//////////////////////////////////////////////////////////////////////////////////
		//		Init buildings (sider)					//
		//////////////////////////////////////////////////////////////////////////////////
		function generateBuilding(x,z){
			var buildings = THREEx.Environment.building()
			scene.add(buildings)
			var velocity	= new THREE.Vector3(x, generateBuildingHeight(), z)
			buildings.position.add(velocity)
			//buildings.rotation.x = -1.57
			if(x > 0) {
				x=0-x
				generateBuilding(x,z)
			}
		}

		//first few buildings
		function generateFewBuildings(defaultPosition){
			for(var i=-55; i<=21; i+=15.2){
				var randX = (Math.random() * (12.000 - 11.000) + 11.000).toFixed(4)
				generateBuilding(randX,defaultPosition+i)
			}
		}

		//generating next buildings
		generateFewBuildings(defaultPosition)
		var buildingScale = 15.2
		onRenderFcts.push(function(delta, now){
			if(buildingScale<mainCharacter.character.object3d.position.z){
				var randX = (Math.random() * (12.000 - 11.000) + 11.000).toFixed(4)
				generateBuilding(randX,mainCharacter.character.object3d.position.z+20)
				buildingScale+=15.2
			}
		})

	//////////////////////////////////////////////////////////////////////////////////
	//		Create giant character model							//
	//////////////////////////////////////////////////////////////////////////////////
	var giantCharacter =  new THREEx.MD2CharacterRatmahatta()
	scene.add(giantCharacter.character.object3d)
	onRenderFcts.push(function(delta){
			if(!playMusic && music1Buffer){
				var musicName = "music" + musicNumber
				playSound(musicName)
				playMusic = true
				musicNumber++
			}
		giantCharacter.update(delta)
	})
  defaultValuesGiantCharacter(giantCharacter)

	//////////////////////////////////////////////////////////////////////////////////
	//		animation based on velocity					//
	//////////////////////////////////////////////////////////////////////////////////

	var crwalking = false
	onRenderFcts.push(function(delta, now){
		if(killed){
			mainCharacter.setAnimationName('salute')
		}else{
			if(!getPaused()){
				var inputs	= mainCharacter.controls.inputs
				if( inputs.up || inputs.down || inputs.left || inputs.right ){
					if(crwalking==true){
						mainCharacter.setAnimationName('crwalk')
					}else{
						mainCharacter.setAnimationName('run')
					}
				}else {
					mainCharacter.setAnimationName('stand')
				}
				if( inputs.up ) score += Math.round(mainCharacter.character.object3d.position.z/10)
				if( inputs.down ) score -= Math.round(mainCharacter.character.object3d.position.z/10)
				if( inputs.jump )	mainCharacter.setAnimationName('jump')
			}
		}
	})

	//////////////////////////////////////////////////////////////////////////////////
	//		Collision between character and obstacle				//
	//////////////////////////////////////////////////////////////////////////////////
  var minDistance = 0
  var oldTime = 0
	var specialObstacle = ""
	onRenderFcts.push(function(delta, now){
		// only if the character is loaded
		if (mainCharacter === null) return
		// compute distance between character and the obstacle

		var distance = mainCharacter.character.object3d.position.distanceTo(obstacle.position)

		if (obstacleNumber==5){
			minDistance = 2
		}

		if (obstacleNumber==4){
			var distanceZ = obstacle.position.z + mainCharacter.character.object3d.position.z
			if(
					(mainCharacter.character.object3d.position.z>=obstacle.position.z-0.5)&&
					(mainCharacter.character.object3d.position.z<=obstacle.position.z+0.5)&&
					(mainCharacter.character.object3d.position.y<=0.01)
				)
				distance = minDistance
		}
		if(obstacleNumber!=5&&obstacleNumber!=4){
			if (distance <= minDistance*2) {
				obstacle.material.opacity -= 0.1
			}else{
				if(obstacle.material.opacity <= 0.9){
					obstacle.material.opacity+= 0.1
				}
			}
		}
		if (distance <= minDistance) {
			oldTime = useObstacle(mainCharacter,specialObstacle)
			if(specialObstacle=="mistake"){
				crwalking=true
				playSound("bad")
			}else{
				playSound("good")
			}
			if(specialObstacle=="heart") health = incHealth()
			destroyObstacle()
			createObstacle()
		}
		if (oldTime+4000 < getActualTime() && oldTime!=0){
			oldTime = 0
			crwalking=false
			useObstacle(mainCharacter,"default")
		}
	})

	//////////////////////////////////////////////////////////////////////////////////
	//		Create obstacle	model				//
	//////////////////////////////////////////////////////////////////////////////////
	var obstacle = null
	var obstacleNumber = 0
	function createObstacle(){
		obstacleValues = generateObstacleType()
		obstacle = obstacleValues[0]
		specialObstacle = obstacleValues[1]
		obstacleNumber = obstacleValues[2]
		scene.add(obstacle)
		obstacle.position.x	= 0.00
		obstacle.castShadow = true
		var obstacleScale = (Math.random() * (1.500 - 0.500) + 0.500).toFixed(4)
		var obstacleValues = setObstacleVerticalDistance(obstacleScale)
		//obstacle.position.y = obstacleValues[0]
		if(obstacleNumber==5){
			obstacle.position.y = 2
		}else{
			obstacle.position.y = 1
		}
		//minDistance = obstacleValues[1]
		if(obstacleNumber==4){
			minDistance = 0.5
		}else{
			minDistance = 0.8
		}
		//obstacle.geometry = new THREE.CubeGeometry( obstacleScale, obstacleScale, obstacleScale);
		resetObstacle()
	}
	createObstacle()

	//////////////////////////////////////////////////////////////////////////////////
	//		Reset obstacle	funciton				//
	//////////////////////////////////////////////////////////////////////////////////
	function resetObstacle(){
		var distanceX = generateObstacleDistance(obstacleNumber)
		var distanceY = -0.50
		if (obstacleNumber==4) {
			distanceX = 0
			distanceY = -0.75
		}
		if (obstacleNumber==2) {
			moveZ = (Math.random() >= 0.5) ? true : false
		}
		var z = mainCharacter.character.object3d.position.z+14;
		var velocity	= new THREE.Vector3(distanceX, distanceY, z);
		obstacle.position.add(velocity)
	}

	//////////////////////////////////////////////////////////////////////////////////
	//		Destroy obstacle				//
	//////////////////////////////////////////////////////////////////////////////////
	function destroyObstacle(){
		distance = 0.00
		scene.remove( obstacle )
		obstacle.position.add(new THREE.Vector3(0, 0, 0))
	}


	//////////////////////////////////////////////////////////////////////////////////
	//		Laser movement fuctnion						//
	//////////////////////////////////////////////////////////////////////////////////
	var moveX = false
	var moveZ = false
	function laserMovement(delta){
		var obstacleMovementPositionX
		if(obstacle.position.x<=-3.2){
			moveX = true
		}
		if(obstacle.position.x>=2.5){
			moveX = false
		}
		if(moveX){
			obstacleMovementPositionX = delta * 5.5;
			if(obstacleNumber==3)obstacle.rotation.z	-= Math.PI*2*0.5*delta
		}else{
			obstacleMovementPositionX = delta * -5.5;
			if(obstacleNumber==3)obstacle.rotation.z	+= Math.PI*2*0.5*delta
		}
		return obstacleMovementPositionX
	}

	//////////////////////////////////////////////////////////////////////////////////
	//		Auto move obstacle						//
	//////////////////////////////////////////////////////////////////////////////////
	var distance = 0.0
	var farAway = false
  var obTimer = 0
	onRenderFcts.push(function(delta, now){
		// move the obstacle to back
		distance += -1 * delta * 0.0008
		if(obstacleNumber==2){
			var obstacleMovementPositionX = laserMovement(delta)
			var obstacleMovementPositionZ = moveZ ? -obstacleMovementPositionX : obstacleMovementPositionX
			if (obstacleMovementPositionX){
					var velocity	= new THREE.Vector3(obstacleMovementPositionX*3, 0, obstacleMovementPositionZ);
					obstacle.position.add(velocity)
			}
		}
		if(obstacleNumber==3){
			var obstacleMovementPositionX = laserMovement(delta)
			if (obstacleMovementPositionX){
					var velocity	= new THREE.Vector3(obstacleMovementPositionX, 0, 0);
					obstacle.position.add(velocity)
			}
		}
		//var velocity	= new THREE.Vector3(0, 0, distance);
		//obstacle.position.add(velocity)
		if(obstacleNumber>=6){
			obstacle.rotation.y	-= Math.PI*2*0.5*delta
		}

		// make it warp
		if (mainCharacter.character.object3d.position.z>obstacle.position.z+10) {
			farAway = true
			if(farAway){
				obstacle.material.visible = true

				obTimer++
				if ((obTimer >= 10 && obTimer < 15)||(obTimer >= 20 && obTimer < 25)||
						(obTimer >= 30 && obTimer < 35)||(obTimer >= 40 && obTimer < 50))
						obstacle.material.visible = false
			}
			if(obTimer>=50){
				obstacle.material.visible = false
				farAway = false
				obTimer = 0
			}
			if (mainCharacter.character.object3d.position.z>obstacle.position.z+17) {
				destroyObstacle()
				createObstacle()
			}
		}
	})

		//////////////////////////////////////////////////////////////////////////////////
		//		Giant character change						//
		//////////////////////////////////////////////////////////////////////////////////
		onRenderFcts.push(function(delta, now){
			if(!getPaused()){
				var distance	= getGiantSpeed() * delta
				if(mainCharacter.character.object3d.position.z>giantCharacter.character.object3d.position.z+36){
					giantCharacter.character.object3d.position.z = mainCharacter.character.object3d.position.z-35
				}else{
					var velocity	= new THREE.Vector3(0, 0, distance)
					giantCharacter.character.object3d.position.add(velocity)
				}
				giantCharacter.character.object3d.position.y = 4.5
				if(catched || killed){
					giantCharacter.character.object3d.position.z = mainCharacter.character.object3d.position.z-35
					giantCharacter.setAnimationName('flip')
				}else{
					giantCharacter.setAnimationName('run')
				}
			}else{
				giantCharacter.character.object3d.position.z = giantCharacter.character.object3d.position.z
				giantCharacter.character.object3d.position.y = 4.5
			}
		})

		//////////////////////////////////////////////////////////////////////////////////
		//		Collision between main character and giant				//
		//////////////////////////////////////////////////////////////////////////////////
		var timer = 0
		onRenderFcts.push(function(delta, now){
			// only if the character is loaded
			if (mainCharacter === null) return
			// compute distance between character and the obstacle
			if(mainCharacter.character.object3d.position.z<=giantCharacter.character.object3d.position.z+2){
				catched = true
				playSound("catched")
			}
			if(catched){
				mainCharacter.setSkinName('dead')
				timer++
				if ((timer >= 20 && timer < 40)||(timer >= 60 && timer < 80)||
						(timer >= 100 && timer < 120)||(timer >= 140 && timer < 160))
					mainCharacter.setSkinName('ratamahatta')
			}
			if(timer==1){
				health = decHealth()
			}
			if(timer>=160){
				mainCharacter.setSkinName('ratamahatta')
				catched = false
				timer = 0
			}
		})

	//////////////////////////////////////////////////////////////////////////////////
	//		Camera Controls							//
	//////////////////////////////////////////////////////////////////////////////////

	var cameraDistance = 0.0
	var cameraLimitY = 0.22232557270104733
	var mouse	= {x : 0, y : 0}

	document.addEventListener('mousemove', function(event){
	  mouse.x	= (event.clientX / window.innerWidth ) - 0.5
		mouse.y	= (event.clientY / window.innerHeight) - 0.5
	}, false)

	onRenderFcts.push(function(delta, now){
		if((mouse.x==0 && mouse.y==0) || (getFixedView())){
			camera.position.x = 0
			camera.position.y = getCameraDefaultY()
		}else{
	 		camera.position.x += (mouse.x*5 - camera.position.x) * (delta*3)
			if (camera.position.y>= cameraLimitY){
				camera.position.y += (mouse.y*5 - camera.position.y) * (delta*3)
			}else{
				camera.position.y -= (-((mouse.y*5 - camera.position.y) * (delta*3)) - cameraLimitY)/100
			}
			if(camera.position.y < 0) camera.position.y = cameraLimitY
		}
		// Basics for ZoomOut cam
		camera.position.z = mainCharacter.character.object3d.position.z + getCameraDefaultZ()
		if(getLoaded()){
			camera.position.y = 2
			camera.position.z = 7
		}
		camera.lookAt( scene.position )
	})

	//////////////////////////////////////////////////////////////////////////////////
	//		render the scene						//
	//////////////////////////////////////////////////////////////////////////////////
	var stageDiff = 5000;
	var stageMult = 1;
	var stageTimer = 0;
	var timerStart = false;
	onRenderFcts.push(function(){
		renderer.render( scene, camera );
		document.getElementById('score').innerHTML = "Score: " + score
		if(health==0) {
			gameOver(score)
      killed = true
		}
		if(score>=stageDiff){
			stageMult++
			setChangedStage(true)
			setWindowShowed(true)
			incStage()
			stageDiff+=(10000*stageMult)
		}
		if(mainCharacter.character.object3d.position.z+18 <= getStartStage()){
				timerStart = true
		}else{
			timerStart ? stageTimer++ : stageTimer = 0
			if(stageTimer>=1){
				//&& getWindowShowed()
				document.getElementById('stage').innerHTML = "Stage: " + getStage()
				document.getElementById('stagetext').innerHTML = "Stage " + getStage()
				newWindowStage(true)
			}
			if(stageTimer>250){
				setWindowShowed(false)
				newWindowStage(false)
				timerStart = false
			}
		}
	})
	var extraScoreTimer = 0
	onRenderFcts.push(function(){
			getExtraScore() ? extraScoreTimer++ : extraScoreTimer = 0
			if(extraScoreTimer==1) score += addExtraScore()
			if(extraScoreTimer>100){
				removeExtraScore()
				setExtraScore(false)
			}
	})

	//////////////////////////////////////////////////////////////////////////////////
	//		Rendering Loop runner						//
	//////////////////////////////////////////////////////////////////////////////////
	var lastTimeMsec= null
	var secondMusic = false
	var thirdMusic = false
	requestAnimationFrame(function animate(nowMsec){
		// keep looping
		requestAnimationFrame( animate );
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
		lastTimeMsec	= nowMsec
		if(Math.floor(nowMsec*0.001)==58 && secondMusic ==false) {
			playMusic = false
			secondMusic = true
		}
		if(Math.floor(nowMsec*0.001)==117 && thirdMusic ==false) {
			playMusic = false
			thirdMusic = true
		}
		// call each update function
		onRenderFcts.forEach(function(onRenderFct){
			onRenderFct(deltaMsec/1000, nowMsec/1000)
		})
	})
})
