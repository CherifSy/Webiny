import Webiny from 'Webiny';

class FieldInfo extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.bindMethods('showInfo,hideInfo');
    }

    showInfo() {
        this.refs.dialog.show();
    }

    hideInfo() {
        this.refs.dialog.hide();
    }
}

FieldInfo.defaultProps = {
    renderer() {
        const info = (
            <a onClick={this.showInfo} href="javascript:void(0);">
                <span className="icon icon-info"/>
            </a>
        );

        const {Button, Modal} = this.props;

        const modal = (
            <Modal.Dialog ref="dialog">
                <Modal.Header title={this.props.title}/>
                <Modal.Body children={this.props.children}/>
                <Modal.Footer>
                    <Button label="Close" onClick={this.hideInfo}/>
                </Modal.Footer>
            </Modal.Dialog>
        );

        return (
            <webiny-field-info>
                {info}
                {modal}
            </webiny-field-info>
        );
    }
};

export default Webiny.createComponent(FieldInfo, {modules: ['Modal', 'Button']});