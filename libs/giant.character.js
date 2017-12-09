//////////////////////////////////////////////////////////////////////////////////
//		Setup giant character							//
//////////////////////////////////////////////////////////////////////////////////
function defaultValuesGiantCharacter(giantCharacter){
	giantCharacter.character.animationFPS = 5
	giantCharacter.character.scale = 1/5
	giantCharacter.character.object3d.position.x = 0
	giantCharacter.character.object3d.position.y = 4.5
	giantCharacter.character.object3d.position.z = -30

	giantCharacter.character.addEventListener('loaded', function(){
		giantCharacter.setSkinName('dead')
		giantCharacter.setWeaponName('none')
		giantCharacter.setAnimationName('run')
	})
}