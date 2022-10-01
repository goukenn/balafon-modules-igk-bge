<?php 
// @author: C.A.D. BONDJE DOUE
// @filename: BgeComponent.php
// @date: 20220827 06:12:09
// @desc: base bge dom component

namespace igk\bge\Components;

use igk\bge\BgeConstants;

/**
 * 
 * @package igk\bge\Components
 */
class BgeWebglSurface extends BgeComponent{
    protected $tagname = "div";
    public $uriBase;   
    protected function initialize(){
        parent::initialize();
        $this["class"]="igk-webgl-surface";
        $this["xmlns:bge"] = BgeConstants::WebGL_NS;       
    }
}