<?php 
// @author: C.A.D. BONDJE DOUE
// @filename: BgeComponent.php
// @date: 20220827 06:12:09
// @desc: base bge dom component

namespace igk\bge\Components;

use igk\js\common\JSExpression;
use IGKException;

class BgeGameSurface extends BgeComponent{
    protected $tagname = "div";
    public $uriBase;
    public function __construct(string $uriBase="")
    {
        $this->uriBase = $uriBase;
        parent::__construct();
    }
    protected function initialize(){
        parent::initialize();
        $this["class"]="igk-bge-game-surface";
        $this["xmlns:bge"] = "http://schema.igkdev.com/bge/2018";
        $this["bge:uribase"] = $this->uriBase;	
    }
    /**
     * get the options
     */
    public function getOptions(){
        return $this["igk-data-options"];
    }
    /**
     * set the options
     * @param mixed $o 
     * @return void 
     * @throws IGKException 
     */
    public function setOptions($o){
        $this->data["igk-data-options"] = JSExpression::Stringify($o);
        return $this;
    }
}