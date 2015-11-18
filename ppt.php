<?php

/*
	Creates PPT file from images supplied via JSON POST from phaidra+
	- Images downloaded via curl
	- PPT is created
*/

include_once 'external/php/PHPPowerPoint.php';

$_PPT_STORAGE_PATH = 'cache/';

$_SLIDE_SIZE = array('height' => 540, 'width' => 720);
$_DEFAULT_IMG_SIZE = 960;
$_MAX_SLIDES = 50;
$server =  '';
$maxExecutionThreshold = 0.8;
$maxExecTime = ini_get('max_execution_time');
$startTime = microtime(true);

date_default_timezone_set('Europe/Vienna');
header('Content-Type: application/json');

$ppt = new PHPPowerPoint();

// getting input
$json = $_POST['slides']; //file_get_contents('test/powerpoint.json');

//$json = utf8_decode($json);
$json = json_decode($json, true);


$props = $ppt->getProperties();
$props->setCompany('Universitätsbibliothek | Universität Wien');
$props->setCreated(time());
$props->setCreator('Phaidra+');

// creating random directory
if(!is_dir($_PPT_STORAGE_PATH)) {

	mkdir($_PPT_STORAGE_PATH);
	chmod($_PPT_STORAGE_PATH, 0777);	
}

if (!isset($_POST['pickup'])) {
	$t = 0;
	do {
		$slideId = time().mt_rand(0, 10000);
		$t++;
	}
	while (is_dir($_PPT_STORAGE_PATH.$slideId) && $t < 10000);	
} else {
	$slideId = intval($_POST['pickup']);
}

$dirname = $_PPT_STORAGE_PATH.$slideId;
if (!file_exists($dirname) && !mkdir($dirname)) {
	header($_SERVER["SERVER_PROTOCOL"]." 500 Internal Server Error", null, 500); 
	echo json_encode(array('error' => 'could not find or create directory!'));
	exit(1);
}
chmod($dirname, 0777);

if (!file_exists($dirname.'/image-cache')) {
	mkdir($dirname.'/image-cache');
	chmod($dirname.'/image-cache', 0777);	
}

$bgPath = $dirname.'/image-cache/bg.png';
$bgUrl = "theme/img/bg.png";
// downloading image
if (!file_exists($bgPath)) {
	file_put_contents($bgPath, fopen($bgUrl, 'r'));
}

$i = 0;
foreach ($json as $slideInfo) {
	// transforming img paths
	//$imgUrl = parse_url($slideInfo['img']);
	$imgUrl = ($slideInfo['img']);
	$imgUrl = str_replace("http://","https://",$imgUrl);
	
	//$imgUrl = $imgUrl['scheme'].'://'.$imgUrl['host'].$imgUrl['path'].'?FORMAT=jpg&BOX='.$_DEFAULT_IMG_SIZE;
	//$imgUrl =$server.$imgUrl['path'].'?FORMAT=jpg&BOX='.$_DEFAULT_IMG_SIZE;
	$pathinfo = pathinfo($slideInfo['url']);
	$imgPath = $dirname.'/image-cache/'.str_replace(':', '-', $pathinfo['filename']).'_curl.jpg';


	// downloading image
	if (!file_exists($imgPath)) {
		$source = $imgUrl;
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $source);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_SSLVERSION,3);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER,false);
		$data = curl_exec ($ch);
		$error = curl_error($ch); 
		curl_close ($ch);

		$destination = $imgPath;
		$file = fopen($destination, "w+");
		fputs($file, $data);
		fclose($file);
		//file_put_contents($imgPath, fopen($imgUrl, 'r'));
		sleep(.1);
	}

	// getting image size
	$dims = getimagesize($imgPath);
	$landscape = ($dims[0] >= $dims[1]);
	$ratio = $dims[0] / $dims[1];
	$newWidth = $dims[0];
	$newHeight = $dims[1];
	$offsetX = 0;
	$offsetY = 0;

	// adding one slide per image
	$slide = $ppt->createSlide();
	
	$bg = $slide->createDrawingShape();
	$bg->setWidth($_SLIDE_SIZE['width']);
	$bg->setHeight($_SLIDE_SIZE['height']);
	$bg->setPath($bgPath)->setOffsetX(0)
		->setOffsetY(0);

	$img = $slide->createDrawingShape();
	$img->setPath($imgPath);

	if ($landscape) {
		if (true) { //$dims[1] > $_SLIDE_SIZE['height'] * 1.33333 - 133) {
			$newHeight = $_SLIDE_SIZE['height'] * 1.33333 - 90;
			$newWidth = $ratio * $newHeight;
		}
		$offsetX = ($_SLIDE_SIZE['width'] * 1.33333 - $newWidth) / 2;
		$offsetY = 90;
	} else {
		if (true) { //$dims[0] > $_SLIDE_SIZE['width'] * 1.33333 - 266) {
			$newWidth = $_SLIDE_SIZE['width'] - 200;
			$newHeight = $newWidth / $ratio;
		}
		$offsetX = $_SLIDE_SIZE['width'] * 1.33333 - $newWidth;
		$offsetY = 0;
	}

	$img
		->setWidth(round($newWidth))
		->setHeight(round($newHeight))
		->setOffsetX(round($offsetX))
		->setOffsetY(round($offsetY));

	// adding text to the slide
	$title = $slide->createRichTextShape();
	if(is_array($slideInfo['title'])) {
		$slideInfo['title'] = join(" | ",$slideInfo['title']);
	}
	
	$titleText = substr($slideInfo['title'], 0, 80);
	$titleText.= (strlen($slideInfo['title']) > 80) ? '...' : '';
	$titleFormat = $title->createTextRun($titleText);
	$titleFormat->getFont()
		->setSize(28)
		->setBold(true);

	if ($landscape) {
		$title
			->setWidth($_SLIDE_SIZE['width'])
			->setHeight(90);
	} else {
		$title
			->setWidth(266)
			->setHeight(round($_SLIDE_SIZE['height']/2));
	}

	$i++;
	if (microtime(true) - $startTime >= $maxExecTime * $maxExecutionThreshold || $_MAX_SLIDES <= $i)	{
		break;
	}
}

if ($i == count($json)) {
	//$ppt->removeSlideByIndex(0);

	$writer = PHPPowerPoint_IOFactory::createWriter($ppt, 'PowerPoint2007');
	$writer->save($dirname.'/presentation.pptx');

	chmod($dirname.'/presentation.pptx', 0777);
	echo json_encode(array('file' => $dirname.'/presentation.pptx', 'execTime' => microtime(true) - $startTime));
	exit(0);
}

echo json_encode(array('pickup' => $slideId));
exit(0);