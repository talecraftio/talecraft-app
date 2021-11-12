import React from 'react';
import { Link } from 'react-router-dom';

interface IFooterProps {
}

const Footer = ({}: IFooterProps) => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__row">
                    <div className="footer__col">
                        <a className="footer__logo" href="#">
                            <img src={require('url:../images/footer-logo.png')} alt="" />
                        </a>
                        <span className="footer__copyright">© TaleCraft Labs</span>
                    </div>
                    <div className="footer__col"><span className="footer__title">About</span>
                        <ul className="footer-list">
                            <li><a href='https://app.talecraft.io/images/TaleCraft_Pitchdeck.pdf' target='_blank'>Whitepaper</a></li>
                            <li><a href="https://docs.talecraft.io/" target='_blank'>Project Overview</a></li>
                            <li><a href="https://docs.talecraft.io/tokenomics" target='_blank'>Tokenmetrics</a></li>
                            <li><Link to="/team">Team</Link></li>
                        </ul>
                    </div>
                    <div className="footer__col"><span className="footer__title">Social</span>
                        <ul className="footer-list">
                            <li><a href="https://t.me/talecraft" target='_blank'>Telegram</a></li>
                            <li><a href="https://twitter.com/talecraftio" target='_blank'>Twitter</a></li>
                            <li><a href="#" target='_blank'>Discord</a></li>
                            <li><a href="https://medium.com/@talecraft" target='_blank'>Medium</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    )
};

export default Footer;
