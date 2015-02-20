import BaseComponent from '/Core/Base/BaseComponent';

class Link extends BaseComponent {

	getFqn(){
		return 'Core.View.Link';
	}
	
	getDynamicProperties(){
		var link = this.props.href;
		var classes = this.props.className;

		if(typeof classes == 'string'){
			classes = classes.split(' ');
			classes.push('w-link');
			classes = classes.join(' ');
		} else if(classes instanceof Object) {
			classes['w-link'] = true;
			classes = this.classSet(classes);
		}
		
		// Build URL
		if(this.props.params){
			Object.keys(this.props.params).forEach((param) => {
				link = link.replace(':'+param, this.props.params[param]);
			});
		}

		return {
			link: link,
			classes: classes
		}
	}
}

export default Link;