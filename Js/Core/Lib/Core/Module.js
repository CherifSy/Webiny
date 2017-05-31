import Webiny from 'Webiny';
import Menu from './Menu';

class Module {

    /**
     * Instantiate a module of given app instance
     * @param app
     */
    constructor(app) {
        this.app = app;
        this.menus = [];
        this.settings = [];
    }

    /**
     * Setup the module
     * This module is called right after the constructor
     */
    init() {
        // Override to implement
    }

    /**
     * Get module name
     * @returns {string}
     */
    getName() {
        return this.name;
    }

    /**
     * @param components
     * @returns {Module}
     */
    registerComponents(components) {
        _.forEach(components, (value, key) => {
            _.set(this.app, `${this.getName()}.Components.` + key, value);
        });
        return this;
    }

    /**
     * @returns {Module}
     */
    registerRoutes(...routes) {
        _.each(routes, route => {
            route.setModule(this);
            Webiny.Router.addRoute(route);
        });
        return this;
    }

    /**
     * @param content
     * @returns {Module}
     */
    registerDefaultComponents(content) {
        Webiny.Router.setDefaultComponents(content);
        return this;
    }

    registerMenus(...menus) {
        _.each(menus, menu => Menu.add(menu));
        return this;
    }

    registerDefaultLayout(component) {
        this.registerLayout('default', component);
        return this;
    }

    registerLayout(name, component) {
        Webiny.Router.addLayout(name, component);
        return this;
    }
}

export default Module;