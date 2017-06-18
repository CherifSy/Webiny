<?php
namespace Apps\Webiny\Php\Entities;

use Apps\Webiny\Php\DevTools\Entity\AbstractEntity;
use Apps\Webiny\Php\DevTools\Entity\Filter;
use Apps\Webiny\Php\DevTools\Exceptions\AppException;
use Webiny\Component\Mongo\Index\CompoundIndex;
use Webiny\Component\Mongo\Index\SingleIndex;

/**
 * Class ApiTokenLog
 *
 * @property string $id Log ID
 * @property string $method HTTP method
 * @property string $token Token ID or 'system' if request was made using system API token
 * @property array  $request Request details
 *
 * @package Apps\Webiny\Php\Entities
 *
 */
class ApiTokenLog extends AbstractEntity
{
    protected static $entityCollection = 'ApiTokenLogs';
    protected static $entityMask = '{id}';

    protected static function entityQuery()
    {
        return [
            new Filter('*', function ($conditions) {
                if (!isset($conditions['token'])) {
                    $conditions['token'] = ['$ne' => 'system'];
                }

                return $conditions;
            })
        ];
    }

    public function __construct()
    {
        parent::__construct();

        $this->index(new SingleIndex('token', 'token'));
        $this->index(new SingleIndex('createdOn', 'createdOn', false, false, false, 604800)); // expire after 7 days
        $this->index(new CompoundIndex('methodUrl', ['request.url', 'request.method']));

        $this->attr('token')->char();
        $this->attr('request')->object()->setToArrayDefault();
        $this->attr('method')->char()->setToArrayDefault();

        $this->attributes->removeKey('modifiedOn');

        $this->api('GET', '/', function ($parent) {
            $filters = $this->wRequest()->getFilters();
            if (isset($filters['token']) && $filters['token'] === 'system') {
                throw new AppException('You can not access system token logs using this entity!');
            }

            return $parent();
        });
    }
}