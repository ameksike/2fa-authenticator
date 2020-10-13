class Factory
{
    constructor(){
        this.mods = {};
        console.log('IOC-Factory-constructor...');
    }

    get(name, type){
        type = type || 'controller'
        if(!this.mods[name]){
            let _class = require( __dirname + '/../'+type+'/' + name + '.js' );
            this.mods[name] = new _class();
        }
        return this.mods[name];
    }
}

module.exports = new Factory();