<?php 

header("Content-Type: text/javascript");
if (file_exists($f = dirname(__FILE__)."/load_shader.pjs")){
	define("BGE_LOADER_DIR", realpath(dirname(__FILE__)."/../../"));  
	include_once($f);
}