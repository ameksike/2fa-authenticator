class Tpl
{
    constructor(){
        this.path = {
            'view': __dirname + '/../view/',
            'cache': __dirname + '/../../cache/'
        };
        console.log('Tpl-constructor...');
    }
    compile(name, values){
        var data = require('fs').readFileSync( this.path.view + name + '.html').toString();
        for(let i in values){
            data =  data.replace('{'+i+'}', values[i]);
        }
        return data;
    }

    setCache(name, value){
        if( value instanceof Object){
            value = JSON.stringify(value);
        }
        require('fs').writeFile( this.path.cache + name + '.cache', value, (err) => console.log(err ? err:'Success: save cache -> '+name ) );
    }

    getCache(name, type){
        type = type || 'text';
        let data = '';
        try{
            data = require('fs').readFileSync( this.path.cache + name + '.cache').toString();
            if(type == 'json'){
                data = JSON.parse(data);
            }
        }
        catch(error){
            console.log('Error: '+name+' does not exist in cache!');
        }
        return data ;
    }
}

module.exports = new Tpl();