import React, { Component } from 'react';

export default class Footer extends Component {
    render () {
        return (
            <footer id="footer">
                <div className="container">
                    <div className="copyright">&copy; Copyright held by UCF. All Rights Reserved</div>
                    <div className="credits">
                    {/*
                    All the links in the footer should remain intact.
                    You can delete the links only if you purchased the pro version.
                    Licensing information: https://bootstrapmade.com/license/
                    Purchase the pro version with working PHP/AJAX contact form: https://bootstrapmade.com/buy/?theme=Reveal
                    */}
                    Designed by <a href="https://bootstrapmade.com/">BootstrapMade</a>
                    </div>
                </div>
            </footer>
        );
    }
}