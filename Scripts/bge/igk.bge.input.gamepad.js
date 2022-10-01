"uses stricts";
(function(){
	var _gameButtons=["A","B", "X","Y", "LB","RB", "LT", "RT","SL", "SM",  "L3", "R3", "PadT", "PadB", "PadL", "PadR"];
	var _playerKey=["One", "Two", "Three", "Four"];
	var _gamePads = [];
	var gamePadButton={};
	var j = 0;
	for(var i in _gameButtons){
		gamePadButton[_gameButtons[i]] = j++;
	}
	
	var _getPadsFunc = (function(){
			if (navigator.getGamepads)
				return function(){ return navigator.getGamepads();};
			if (window.webKitNavigator && webKitNavigator.getGamepads)
				return  function(){ webKitNavigator.getGamepads();};
			return null;
	})();
	
	if (!_getPadsFunc){
		console.log('[bge.input] browser : no gamepad available');
		igk.system.createNS("igk.html5.input",{
			gamePads:function(){return undefined;}
		});
		return;
	}
	var m_manager = null;
	
	
	
	igk.system.createNS("igk.bge.input",{
		gamePads:function(){
			if (m_manager)
				return m_manager;
			if (this instanceof igk.object){
				//console.debug("ok....");
				if (m_manager == null)
					return new igk.html5.input.gamePads();
			}
			igk.appendProperties(this,{
				update:function(){
					var _pads = _getPadsFunc();
					var _p =null;
					var _pi =null;
					// console.debug(_pads.length);
					
					for(var i =0; i<_pads.length; i++){
						_p = _pads[i];
						if (_p){
							//console.debug(_p);
							if (_p.mapping=="standard"){
								_pi = "player"+_playerKey[_p.index];
								if (this[_pi])
									this[_pi].update(_p);
								else
									this[_pi] = new __gameInput(_p);
							}
						}
					}
				}
			});
			m_manager = this;
		}
	});
	
	igk.defineProperty(igk.html5.input, "gameButtons", {get: function(){return gamePadButton;}});
	
	
		function __gameInput(pad){
		var m_gamepad = pad;
		var m_downkeys = []; //store previous downkey for release
		igk.appendProperties(this, {
			isKeyPressed:function(//game key
			a){
				return m_gamepad.buttons[a].pressed;
			},
			isKeyRelease:function(a){
				if (this.isKeyPressed(a)){
					m_downkeys[a] = 1;
					return 0;
				}
				if (m_downkeys[a]){
					m_downkeys[a]=0;
					return 1;
				}
				return 0;
			},
			keyValue:function(a){
				return m_gamepad.buttons[a].value;
			},
			
			update:function(pad, release){
				m_gamepad = pad;				
			}
		});
		function __toStringAxe(){
			return "{x:"+this.x+"y:"+this.y+"}"; 
		};
		igk.defineProperty(this, "LAxe", {get:function(){return {x: m_gamepad.axes[0], y:m_gamepad.axes[1], toString:__toStringAxe}; }});
		igk.defineProperty(this, "RAxe", {get:function(){return {x: m_gamepad.axes[2], y:m_gamepad.axes[3], toString:__toStringAxe}; }});
		
	}
	
	//detect game pad
	// var update=function(){
		// console.debug("run");
	
	
	// test();
	// igk.animation.getAnimationFrame()(update);
	// };
	

		// igk.animation.getAnimationFrame()(update);
		
		
		//what i want
			// function test(){
		// var gamePadsInput = igk.html5.input.gamePads();
		
		// gamePadsInput.update();
		// _playerOne = gamePadsInput.playerOne;
		// if (_playerOne)
			// console.debug(_playerOne);
			// console.debug("Check for key pressed A ? "+_playerOne.isKeyPressed(gamePadButton.A));
			// for(var i in gamePadButton){
				// var btn = gamePadButton[i];
				// if (_playerOne.isKeyPressed(btn)){
					// console.debug("your pressed : "+i +"+ "+_playerOne.keyValue(btn) + " ::: "+_playerOne.RAxe);
				// }
			// }
		// };
})();