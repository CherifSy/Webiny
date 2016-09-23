<?php
namespace Apps\Core\Php\PackageManager\Parser;

use Apps\Core\Php\DevTools\WebinyTrait;
use Apps\Core\Php\DevTools\Exceptions\AppException;
use Webiny\Component\Mongo\MongoTrait;
use Webiny\Component\StdLib\StdLibTrait;
use Webiny\Component\Storage\File\File;

abstract class AbstractParser
{
    use WebinyTrait, StdLibTrait, MongoTrait;

    protected static $classApi = [];
    protected $class;
    protected $name;
    protected $slug;
    protected $url;
    protected $baseClass;
    protected $queryParams = [];
    protected $headerAuthorizationToken;
    protected $headerApiToken;

    abstract public function getApiMethods();

    function __construct($class)
    {
        $this->class = $class;
        $this->name = $this->str($this->class)->explode('\\')->last()->val();
        $this->slug = $this->str($this->name)->kebabCase()->val();

        $this->headerAuthorizationToken = [
            'name'        => 'X-Webiny-Authorization',
            'description' => 'Authorization token',
            'type'        => 'string',
            'required'    => true
        ];

        $this->headerApiToken = [
            'name'        => 'X-Webiny-Api-Token',
            'description' => 'API token to identify 3rd party clients',
            'type'        => 'string',
            'required'    => true
        ];
    }

    public function getAppSlug()
    {
        $appName = $this->str($this->class)->explode('\\')[1];

        return $this->str($appName)->kebabCase()->val();
    }

    /**
     * @return mixed
     */
    public function getClass()
    {
        return $this->class;
    }

    /**
     * @return mixed
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @return mixed
     */
    public function getSlug()
    {
        return $this->slug;
    }

    /**
     * @return mixed
     */
    public function getUrl()
    {
        return $this->url;
    }

    /**
     * Parse entity class
     *
     * @param $class
     *
     * @return array
     * @throws AppException
     * @throws \Webiny\Component\StdLib\StdObject\ArrayObject\ArrayObjectException
     * @throws \Webiny\Component\StdLib\StdObject\StringObject\StringObjectException
     */
    protected function parseApi($class)
    {
        $classes = [$class];
        $classes = array_merge($classes, $this->readClassParents($class));
        foreach ($classes as $c) {
            if ($c === 'Apps\Core\Php\DevTools\Entity\AbstractEntity') {
                break;
            }
            $classes = array_merge($classes, $this->readTraits($c));
        }

        $storage = $this->wStorage('Root');
        $apiDocs = $this->arr();
        foreach ($classes as $apiClass) {
            $classApi = self::$classApi[$apiClass] ?? null;
            if ($classApi) {
                $apiDocs->mergeSmart($classApi);
                continue;
            }

            $classPath = $this->str($apiClass)->explode('\\')->filter();
            $classFile = $this->wApps($classPath[1])->getPath(false) . '/' . $classPath->slice(2)->implode('\\')->replace('\\', '/');

            $classFile = new File($classFile . '.php', $storage);
            if (!$classFile->exists()) {
                return [];
            }

            $classContents = $classFile->getContents();
            $classLines = $this->str($classContents)->explode("\n");

            $tmpDoc = $this->arr();
            $classApi = [];
            foreach ($classLines as $line => $code) {
                $code = $this->str($code)->trim();
                if (!$code->containsAny(['@api', '$this->api('])) {
                    continue;
                }

                if ($code->startsWith('/*') || $code->endsWith('*/')) {
                    continue;
                }

                if ($code->startsWith('$this->api(')) {
                    $match = $code->match('\'(\w+)\',\s?\'([\w+-{}/]+)\'');
                    if (!$match) {
                        continue;
                        // throw new AppException('Failed to parse API method definition: `' . $code->val() . '`', 'WBY-DISCOVER-FAILED');
                    }
                    $httpMethod = strtolower($match->keyNested('1.0'));
                    $methodName = $match->keyNested('2.0');
                    $methodName = $methodName != '/' ? trim($methodName, '/') : '/';
                    if ($methodName) {
                        $classApi[$methodName][$httpMethod] = $tmpDoc->val();
                    }
                    $tmpDoc = $this->arr();
                    continue;
                }

                if ($code->startsWith('* @api')) {
                    $annotationLine = $code->replace('* @api.', '')->explode(' ', 2)->val();
                    $line = $this->str($annotationLine[0]);
                    // Parse parameters and fetch the appropriate value for given parameter type
                    if ($line->startsWith('body.') || $line->startsWith('path.') || $line->startsWith('headers.')) {
                        $param = [
                            'name'        => $line->replace(['body.', 'path.'], '')->val(),
                            'type'        => '',
                            'description' => ''
                        ];

                        if (isset($annotationLine[1])) {
                            $paramLine = $this->str($annotationLine[1])->explode(' ', 2);
                            $param['type'] = $paramLine[0];
                            $param['description'] = $paramLine[1];
                        }

                        $tmpDoc->keyNested($annotationLine[0], $param);
                        continue;
                    }
                    $tmpDoc->keyNested($annotationLine[0], $annotationLine[1]);

                    // Query params will be appended to URL in the EntityParser/ServiceParser classes
                    if ($line->startsWith('query.')) {
                        $paramLine = $this->str($annotationLine[1])->explode(' ', 2);
                        $tmpDoc->keyNested($annotationLine[0], $paramLine[0]);
                    }
                }
            }
            self::$classApi[$apiClass] = $classApi;
            $apiDocs->mergeSmart($classApi);
        }
        
        return $apiDocs;
    }

    private function readTraits($class)
    {
        $traits = $this->readClassUses($class);
        foreach ($traits as $trait) {
            $traitUses = $this->readClassUses($trait);
            if (count($traitUses)) {
                $traits = array_merge($traits, $traitUses);
                foreach ($traitUses as $traitUse) {
                    $traits = array_merge($traits, $this->readTraits($traitUse));
                }
            }
        }

        return $traits;
    }

    private function readClassParents($class)
    {
        return array_filter(array_values(class_parents($class)), function ($t) {
            return $this->str($t)->startsWith('Apps\\');
        });
    }

    private function readClassUses($class)
    {
        return array_filter(array_values(class_uses($class)), function ($t) {
            return $this->str($t)->startsWith('Apps\\');
        });
    }
}