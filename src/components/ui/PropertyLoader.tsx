import React from 'react';

const PropertyLoader: React.FC = () => {
  return (
    <>
      <style>{`
        .property-loader {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          width: 90px;
          height: 103px;
        }

        .property-loader div {
          position: absolute;
          width: 50px;
          height: 31px;
        }

        .property-loader div:nth-of-type(2) {
          transform: rotate(60deg);
        }

        .property-loader div:nth-of-type(3) {
          transform: rotate(-60deg);
        }

        .property-loader div div {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .property-loader div div span {
          position: absolute;
          width: 4px;
          height: 0%;
          background: #1a1a1a;
          z-index: 999999;
        }

        .property-loader .h1 {
          left: 0;
          animation: load1 3.2s ease infinite;
        }

        .property-loader .h2 {
          right: 0;
          animation: load2 3.2s ease 0.4s infinite;
        }

        .property-loader .h3 {
          right: 0;
          animation: load3 3.2s ease 0.8s infinite;
        }

        .property-loader .h4 {
          top: 10px;
          left: 23px;
          animation: load4 3.2s ease 1s infinite;
          transform: rotate(90deg);
        }

        .property-loader .h6 {
          left: 0;
          animation: load6 3.2s ease 1.3s infinite;
        }

        @keyframes load1 {
          0% {
            bottom: 0;
            height: 0;
          }
          6.944444444% {
            bottom: 0;
            height: 100%;
          }
          50% {
            top: 0;
            height: 100%;
          }
          59.944444433% {
            top: 0;
            height: 0;
          }
        }

        @keyframes load2 {
          0% {
            top: 0;
            height: 0;
          }
          6.944444444% {
            top: 0;
            height: 100%;
          }
          50% {
            bottom: 0;
            height: 100%;
          }
          59.944444433% {
            bottom: 0;
            height: 0;
          }
        }

        @keyframes load3 {
          0% {
            top: 0;
            height: 0;
          }
          6.944444444% {
            top: 0;
            height: 100%;
          }
          50% {
            bottom: 0;
            height: 100%;
          }
          59.94444443% {
            bottom: 0;
            height: 0;
          }
        }

        @keyframes load4 {
          0% {
            top: 37px;
            left: 23px;
            height: 134%;
          }
          6.944444444% {
            top: 10px;
            height: 134%;
          }
          50% {
            bottom: 10px;
            height: 134%;
          }
          59.94444443% {
            bottom: 0;
            height: 0;
          }
        }

        @keyframes load6 {
          0% {
            bottom: 0;
            height: 0;
          }
          6.944444444% {
            bottom: 0;
            height: 100%;
          }
          50% {
            top: 0;
            height: 100%;
          }
          59.94444443% {
            top: 0;
            height: 0;
          }
        }
      `}</style>
      <div className="property-loader">
        <div>
          <div>
            <span className="h6" />
            <span className="h3" />
          </div>
        </div>
        <div>
          <div>
            <span className="h1" />
          </div>
        </div>
        <div>
          <div>
            <span className="h2" />
          </div>
        </div>
        <div>
          <div>
            <span className="h4" />
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyLoader;


