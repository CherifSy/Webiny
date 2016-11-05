import Webiny from 'Webiny';
const Ui = Webiny.Ui.Components;

class InlineStyle extends Webiny.Ui.Component {
}

InlineStyle.defaultProps = {
    icon: null,
    plugin: null,
    renderer(){
        const isActive = this.props.plugin.isActive();
        const disabled = this.props.plugin.isDisabled();
        const props = {
            disabled,
            type: isActive ? 'primary' : 'default',
            onClick: () => this.props.plugin.toggleStyle(),
            icon: this.props.icon,
            tooltip: this.props.tooltip
        };
        return (
            <Ui.Button {...props}/>
        );
    }
};

export default InlineStyle;