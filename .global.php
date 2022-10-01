<?php
// BALAFON GAMING ENGINE
// @author: C.A.D. BONDJE DOUE
// version:2.0
// date : 23/01/2017
//desc : global fonction for bge modules
//copyright : see balafon copyright

use IGK\Helper\IO;
use IGK\System\Html\Dom\HtmlItemBase;

igk_sys_lib_ignore(dirname(__FILE__)."/Scripts");
define("BGE_SCRIPT_NAME", "bge-scripts");

function igk_bge_init($doc, $entryuri){
	$s = dirname(__FILE__);
	$resolver = IGKResourceUriResolver::getInstance();
	if (!file_exists($f = $s."/.config")){
		
		$o = "<?php\n";	
		// generate configuration files 
		$o .="\$config[\"libdir\"]=\"".IGK_LIB_DIR."\";\n";
		igk_io_w2file($f, $o);
	}
	$scriptdir = $s."/Scripts";
	if (igk_environment()->is("production")){
		$cachedir = igk_io_cacheddist_jsdir()."/bge-scripts"; 
		$resolver->resolve($cachedir);
		if (!is_dir($cachedir)){							
			// cache all scripts
			igk_cache_gen_cache($scriptdir, $cachedir ,null, function($file, $cfile, $mergescallback)use($cachedir){
				$ext = igk_io_path_ext(basename($file));
				switch($ext){
					case "js":
						$mergescallback($file);					
						break;
					case "php":
					case "pjs":
							IO::CreateDir(dirname($cfile));
							igk_io_symlink($file, $cfile);
							IGKResourceUriResolver::getInstance()->resolve($cfile, null);
							// if (!file_exists($cf = $cdir."/.config")){
								// $out.="<?php\n";
								// $out.="\$config['libdir']='".IGK_LIB_DIR."';\n";
								// $out.="\$config['cachedir']='".$cachedir."';\n";
								// igk_io_w2file($cf, $out);
			
							// }
							return 1; 
					default:
						return 1;
				}
				return 0;
			});
			
			igk_io_w2file($f, json_encode((object)array(
			"date"=>date("Ymd"),
			"name"=>"bge-module",
			"libdir"=>igk_uri(IGK_LIB_DIR),
			"cachedir"=>igk_uri($cachedir),
			"basedir"=>igk_uri(igk_io_basedir())
			)));
			igk_hook(IGKEvents::HOOK_CACHE_RES_CREATED, array("dir"=>$cachedir, "type"=>"js", "name"=>"bge-scripts"));			
			
		}
		$doc->addTempScript($cachedir."/main.js")->activate("defer");
		$doc->addTempScript($cachedir."/bge/bge.js")->activate("defer"); 
	}
	else {
	
		if (!igk_io_is_subdir(igk_io_basedir(), $s)){		
			//resolve all resources to _mod_ folder
			foreach(igk_io_getfiles($s."/Scripts", "/\.(js(on)?|xml|xls|php|pjs)$/") as $b){
			 
			 	$resolver->resolve($b, null);				 
			} 
		}	
		$doc->addTempScript($s."/Scripts/main.js")->activate("defer");
		$doc->addTempScript($s."/Scripts/bge/bge.js")->activate("defer");	
		 
	}	

	if (igk_get_env($key = "sys://module/flags/".__FUNCTION__) != $doc){
		igk_reg_hook(IGKEvents::HOOK_HTML_FOOTER, function($e)use ($entryuri){
			// igk_wln_e("hook body footer");
			$uri = igk_io_baseuri();
			$shader_uri = $entryuri."/assets/bge/js/load_shaders.php";
			 
			igk_create_node("script")->setContent(
				"var _igk_bge_options = {'shader_uri':'{$shader_uri}', 'baseUri':'{$uri}'};".
				"if(igk.bge){ igk.bge.setOption(_igk_bge_options); };"
			)->renderAJX();
		});
		igk_set_env($key, $doc);
	}
}

///<summary>load shaders script to document</summary>
function igk_bge_load_shader($doc, $f){
	$u = dirname(__FILE__)."/Scripts/bge/load_shader.pjs";
		if ($f!=null)
			$u .= "?f=".base64_encode(igk_io_getdir($f));	
	$doc->addTempScript($u);
}
function igk_bge_get_shaders($folder=null){	
	//passing folder to shader scripts
	$u = dirname(__FILE__)."/Scripts/bge/load_shader.pjs";
	IGKOb::Start();
	include($u);
	$o = IGKOb::Content();
	IGKOb::Clear();	
	return $o;
}

///<param name="folder" type="mixed">existing folder or array of exists folder</param>
function igk_bge_bind_shader($t, $folder){
	$vt = is_string($folder)? array($folder):$folder;
	$s="";
	sort($vt);
	foreach($vt as $k){		
		$s .= igk_bge_get_shaders($k);
	}
	$t->addBalafonJS()->Content = $s;	
}
/**
 * create bge GameSurface
 * @param string $uriBase 
 * @return HtmlItemBase<mixed, string> 
 * @throws IGKException 
 */
function igk_html_node_bgeGameSurface($uriBase=''){
	$n = new igk\bge\Components\BgeGameSurface($uriBase);
	return $n;
}

function igk_html_node_webglSurface(){
	$n = new igk\bge\Components\BgeWebglSurface();
	return $n;
}


///<summary>function igk_html_node_webglscriptsurface</summary>
///<param name="scriptFile"></param>
///<param name="shaderFolder"></param>
/**
 * function igk_html_node_webglscriptsurface
 * @param mixed $scriptFile
 * @param mixed $shaderFolder
 */
function igk_html_node_webglscriptsurface($scriptFile, $shaderFolder = null)
{
    if (!igk_is_module_present("bge")) {
        igk_die("/!\\ module :  bge is required ");
    }
    $c = igk_create_node("script");
    $c["type"] = "balafon/bge-script";
    $c["language"] = "";
    $c["class"] = "igk-winui-bge-script";
    $c->Content = igk_bge_get_shaders($shaderFolder) . " " . (file_exists($scriptFile) ? file_get_contents($scriptFile) : null);
    return $c;
}