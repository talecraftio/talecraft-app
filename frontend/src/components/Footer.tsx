import React from 'react';
import { Link } from 'react-router-dom';
import BackgroundAudio from "./BackgroundAudio";

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
                    <div className="footer__col">
                        <span className="footer__title">About</span>
                        <ul className="footer-list">
                            <li><a href={require('url:../images/TaleCraft_Pitchdeck.pdf')} target='_blank'>Whitepaper</a></li>
                            <li><a href="https://docs.talecraft.io/" target='_blank'>Project Overview</a></li>
                            <li><a href="https://docs.talecraft.io/tokenomics" target='_blank'>Tokenmetrics</a></li>
                            {/*<li><a href="https://talecraft.io/terms.html" target='_blank'>Terms</a></li>*/}
                            {/*<li><Link to="/team">Team</Link></li>*/}
                        </ul>
                    </div>
                    <div className="footer__col">
                        <span className="footer__title">Social</span>
                        <ul className="footer-list">
                            <li><a href="https://t.me/talecraft" target='_blank'>Telegram</a></li>
                            <li><a href="https://twitter.com/talecraftio" target='_blank'>Twitter</a></li>
                            <li><a href="https://discord.com/invite/dYjRtRqYK6" target='_blank'>Discord</a></li>
                            <li><a href="https://medium.com/@talecraft" target='_blank'>Medium</a></li>
                        </ul>
                    </div>
                    <div className="footer__row">
                        <div className="footer__col" />
                        <div className="footer__col terms">
                            This web page and any other contents published on this website shall not constitute investment advice, financial advice, trading advice, or any other sort of advice, and you should not treat any of the website's content as such. You alone assume the sole responsibility of evaluating the merits and risks associated with using any information or other content on this website before making any decisions based on such information. You understand that the crypto market is characterised by high volatility, and you should be aware of the concrete possibility of losing the entirety of the funds you allocated in the crypto market. You should refrain from using funds you cannot afford to lose when purchasing cryptocurrencies and other digital tokens and assets.<br />
                            <a href="https://talecraft.io/terms.html" target='_blank'>Terms of Service</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
};

export default Footer;
