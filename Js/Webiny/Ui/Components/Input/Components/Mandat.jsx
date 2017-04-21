import Webiny from 'Webiny';
import styles from '../styles.css';

class Mandat extends Webiny.Ui.Component {

}

Mandat.defaultProps = {
    renderer() {
        return <span className={styles.mandat}>*</span>;
    }
};

export default Mandat;