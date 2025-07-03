import React, { memo, useState } from 'react';
import { LuArrowBigUp } from 'react-icons/lu';
import { LuArrowBigDown } from 'react-icons/lu';
import styled from 'styled-components';
import { formatDigitBasePrice } from '../../../utils/format';
import { FaTimes } from 'react-icons/fa';
import './Account-Manager.scss';
import { useMetricsContext } from '../../../contexts/Metrics-Context.js';

const Heading = styled.div`
  font-size: 10px;
  padding-left: 10px !important;
  padding-right: 10px !important;
  padding-top: 5px !important;
  white-space: nowrap !important;
  color:white;
`;
const Container = styled.div`
  display: flex;
  background-color: #222222;
  padding: 5px !important;
  border-radius: 5px;
`;
const FlexStart = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 5px;
  margin-top: 10px !important;
  margin-bottom: 10px !important;
`;
const FlexEnd = styled.div`
  display: flex;
  justify-content: end;
  gap: 5px;
  margin-right: 10px !important;
  margin-top: 10px !important;
  margin-bottom: 10px !important;
  @media (max-width: 540px) {
    justify-content: flex-start;
  }
`;
const PositionEvent = ({ positionInfo }) => {
  const { setShowDealsModal } = useMetricsContext();

  return (
    <>
      <div className={`window-module responsive-modal`}>
        <div className="wm-header">
          <h2>Position Events</h2>
          <h2>Position ID : PID{positionInfo[0]?.resulting_position_id.toString().padStart(8, "0") || "---" } </h2>
          <div
            className="wm-exit close-icon"
            onClick={() => setShowDealsModal(false)}
          >
            <FaTimes />
          </div>
        </div>
        <div className="wm-content">
          <div className="wm-read-p-in-start">
            <p style={{ textAlign: 'start' }}></p>
          </div>
        </div>

        <div style={{ width: '100%', paddingTop: '20px', overflow: 'auto', height:'280px' }}>
          {positionInfo.map((item) =>
            item.position_impact === 'Opening' ? (
              <FlexStart key={item.dealId}>
                <Container>
                  {item.direction === 'Buy' ? (
                    <LuArrowBigUp
                      size={20}
                      color={item.direction === 'Buy' ? '#21C16C' : '#E13232'}
                    />
                  ) : (
                    <LuArrowBigDown
                      size={20}
                      color={item.direction === 'Buy' ? '#21C16C' : '#E13232'}
                    />
                  )}
                  <Heading>Margin {formatDigitBasePrice(item?.margin, 7)}</Heading>
                </Container>
                <Container>
                  <Heading
                    style={{
                      color: item.direction === 'Buy' ? '#21C16C' : '#E13232',
                    }}
                  >
                    {item.position_impact}
                  </Heading>
                  <Heading>
                    DEAL {item?.dealId?.toString().padStart(8, '0')}
                  </Heading>
                  <Heading>
                    {`${new Date(item.position_opened_at).toLocaleDateString('en-GB')},
                                      ${new Date(
                                        item.position_opened_at,
                                      ).toLocaleTimeString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                      })}`}
                  </Heading>
                  <Heading>Qty {parseFloat(item?.quantity).toFixed(4)}</Heading>
                  <Heading>{item.symbol}</Heading>
                  <Heading>
                    Price {formatDigitBasePrice(item.exit_price, 7)}
                  </Heading>
                </Container>
              </FlexStart>
            ) : (
              <FlexEnd key={item.dealId}>
                <Container>
                  <Heading
                    style={{
                      color: item.direction === 'Buy' ? '#21C16C' : '#E13232',
                    }}
                  >
                    {item.position_impact}
                  </Heading>
                  <Heading>
                    DEAL {item?.dealId?.toString().padStart(8, '0')}
                  </Heading>
                  <Heading>
                    {`${new Date(item.position_opened_at).toLocaleDateString('en-GB')},
                                      ${new Date(
                                        item.position_opened_at,
                                      ).toLocaleTimeString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                      })}`}
                  </Heading>
                  <Heading>Qty {parseFloat(item?.quantity).toFixed(4)}</Heading>
                  <Heading>{item.symbol}</Heading>
                  <Heading>
                    Price {formatDigitBasePrice(item.exit_price, 7)}
                  </Heading>
                </Container>
                <Container>
                  {item.direction === 'Buy' ? (
                    // <LuArrowBigUp
                    //   size={20}
                    //   color={item.direction === 'Buy' ? '#21C16C' : '#E13232'}
                    // />
                    <></>
                  ) : (
                    // <LuArrowBigDown
                    //   size={20}
                    //   color={item.direction === 'Buy' ? '#21C16C' : '#E13232'}
                    // />
                    <></>
                  )}
                  <Heading>Margin {formatDigitBasePrice(item?.margin, 7)}</Heading>
                </Container>
              </FlexEnd>
            ),
          )}
        </div>
      </div>
    </>
  );
};

export default memo(PositionEvent);
