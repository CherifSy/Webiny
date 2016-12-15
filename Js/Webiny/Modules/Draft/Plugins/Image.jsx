import Webiny from 'Webiny';
const Ui = Webiny.Ui.Components;
import AtomicPlugin from './../BasePlugins/AtomicPlugin';
import Utils from './../Utils';

class ImageEditComponent extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {
            size: props.data.size
        };

        this.bindMethods('resize', 'resizeStart', 'resizeEnd', 'getSize');
    }

    alignImage(align) {
        this.props.updateBlockData({align});
    }

    resizeStart(e) {
        this.size = {
            width: this.refs.resizer.clientWidth,
            height: this.refs.resizer.clientHeight
        };

        this.aspectRatio = this.size.width / this.size.height;

        this.position = {
            x: e.clientX,
            y: e.clientY
        };
    }

    resize(e) {
        e.preventDefault();
        const deltaX = this.position.x - e.clientX;
        const deltaY = this.position.y - e.clientY;

        if (Math.abs(deltaX) > 200 || Math.abs(deltaY) > 200) {
            return;
        }

        if (deltaX !== 0) {
            this.size.width = this.size.width - deltaX;
            this.size.height = Math.round(this.size.width / this.aspectRatio);
        } else {
            this.size.height = this.size.height - deltaY;
            this.size.width = Math.round(this.size.height * this.aspectRatio);
        }

        this.position = {
            x: e.clientX,
            y: e.clientY
        };

        this.setState({size: this.size});
    }

    resizeEnd() {
        this.props.updateBlockData({size: this.state.size});
    }

    getSize(offset = 0) {
        return {
            width: _.has(this.state, 'size.width') ? this.state.size.width - offset : 'auto',
            height: _.has(this.state, 'size.height') ? this.state.size.height - offset : 'auto'
        };
    }
}

ImageEditComponent.defaultProps = {
    renderer() {
        const captionChange = caption => this.props.updateBlockData({caption});

        const btnProps = (align) => {
            return {
                type: 'button',
                className: this.classSet('btn btn-default', {active: this.props.data.align === align}),
                onClick: this.alignImage.bind(this, align)
            };
        };

        const draggable = {
            draggable: true,
            onDragStart: this.resizeStart,
            onDrag: this.resize,
            onDragEnd: this.resizeEnd
        };

        return (
            <div className="image-plugin-wrapper">
                <Ui.Grid.Row>
                    <Ui.Grid.Col xs={12}>
                        <div className="btn-group pull-right">
                            <button {...btnProps('left')}>Left</button>
                            <button {...btnProps('center')}>Center</button>
                            <button {...btnProps('right')}>Right</button>
                        </div>
                    </Ui.Grid.Col>
                </Ui.Grid.Row>

                <div className={'image-wrapper'} style={{textAlign: this.props.data.align}}>
                    <div className="resizer" ref="resizer" style={this.getSize()}>
                        <img src={this.props.data.url} style={this.getSize(2)}/>
                        <span className="resize-handle br" {...draggable}></span>
                    </div>
                </div>
                <Ui.Input value={this.props.data.caption} onChange={captionChange} placeholder="Enter a caption for this image"/>
            </div>
        );
    }
};

class ImageComponent extends Webiny.Ui.Component {
    getSize(offset = 0) {
        return {
            width: _.has(this.props.data, 'size.width') ? this.props.data.size.width - offset : 'auto',
            height: _.has(this.props.data, 'size.height') ? this.props.data.size.height - offset : 'auto'
        };
    }
}

ImageComponent.defaultProps = {
    renderer() {
        return (
            <div className="image-plugin-wrapper">
                <div className={'image-wrapper'} style={{textAlign: this.props.data.align}}>
                    <img src={this.props.data.url} {...this.getSize.call(this)}/>
                    <div>{this.props.data.caption}</div>
                </div>
            </div>
        );
    }
};

class ImagePlugin extends AtomicPlugin {
    constructor(config = {}) {
        super(config);
        this.validate = _.get(config, 'validate', 'required');
        this.name = 'image';
        this.id = _.uniqueId('insertImage-');
        this.api = null;
        if (config.api) {
            this.api = new Webiny.Api.Endpoint(config.api);
        }
    }

    submitModal(model, form) {
        if (model.image) {
            form.showLoading();
            this.api.post('/', model.image).then(apiResponse => {
                form.hideLoading();
                delete model.image;
                const file = apiResponse.getData();
                model.url = file.src;
                model.id = file.id;
                model.fromFile = true;
                this.createImageBlock(model);
            });
        } else {
            this.createImageBlock(model);
        }
    }

    createBlock() {
        this.editor.setReadOnly(true);
        this.ui(this.id).show();
    }

    createImageBlock(model) {
        model.plugin = this.name;
        const insert = {
            type: 'atomic',
            text: ' ',
            data: model
        };
        this.ui(this.id).hide().then(() => {
            const editorState = Utils.insertDataBlock(this.editor.getEditorState(), insert);
            this.editor.setEditorState(editorState);
        });
    }

    getEditConfig() {
        return {
            toolbar: <Ui.Draft.Toolbar.Atomic icon="fa-image" plugin={this} tooltip="Insert an image"/>,
            customView: (
                <Ui.Modal.Dialog ui={this.id}>
                    {dialog => (
                        <Ui.Form onSubmit={this.submitModal.bind(this)}>
                            {(model, form) => {
                                const urlValidator = model.image ? null : 'required,url';
                                return (
                                    <wrapper>
                                        <Ui.Form.Loader/>
                                        <Ui.Modal.Header title="Insert image"/>
                                        <Ui.Modal.Body noPadding>
                                            <Ui.Tabs>
                                                <Ui.Tabs.Tab label="URL" icon="fa-link">
                                                    <Ui.Input name="url" placeholder="Enter an image URL" label="URL" validate={urlValidator}/>
                                                </Ui.Tabs.Tab>
                                                <Ui.Tabs.Tab label="Upload" icon="fa-upload">
                                                    <Ui.Files.Image
                                                        name="image"
                                                        cropper={{
                                                        inline: true,
                                                        title: 'Crop your image',
                                                        action: 'Upload image',
                                                        config: {
                                                            closeOnClick: false,
                                                            autoCropArea: 0.7,
                                                            guides: false,
                                                            strict: true,
                                                            mouseWheelZoom: true
                                                        }}
                                                    }/>
                                                </Ui.Tabs.Tab>
                                            </Ui.Tabs>
                                        </Ui.Modal.Body>
                                        <Ui.Modal.Footer align="right">
                                            <Ui.Button type="default" key="cancel" label="Cancel" onClick={dialog.hide}/>
                                            <Ui.Button type="primary" key="submit" label="Insert" onClick={form.submit}/>
                                        </Ui.Modal.Footer>
                                    </wrapper>
                                );
                            }}
                        </Ui.Form>
                    )}
                </Ui.Modal.Dialog>
            ),
            blockRendererFn: (contentBlock) => {
                const plugin = contentBlock.getData().get('plugin');
                if (contentBlock.getType() === 'atomic' && plugin === this.name) {
                    return {
                        component: ImageEditComponent,
                        editable: false
                    };
                }
            }
        };
    }

    getPreviewConfig() {
        return {
            blockRendererFn: (contentBlock) => {
                const plugin = contentBlock.getData().get('plugin');
                if (contentBlock.getType() === 'atomic' && plugin === this.name) {
                    return {
                        component: ImageComponent,
                        editable: false
                    };
                }
            }
        };
    }
}

ImagePlugin.ImageEditComponent = ImageEditComponent;
ImagePlugin.ImageComponent = ImageComponent;

export default ImagePlugin;