import './Button.css';

function Button({ label, click, className }) {
    return (
        <button className={`btn ${className}`} onClick={() => click(label)}>
            {label}
        </button>
    );
}

export default Button;
