import styled from "@emotion/styled"
import React from "react";



export const LoadingBar : React.FunctionComponent<ProgressBarProps> = (props) => {
  const { value, max, loadingBarColor, width } = props;
  const color = loadingBarColor || "#ade6e6";
  return (
    <Container color={loadingBarColor} width={width}>
      <progress value={value} max={max} />
    </Container>
  );
};

const Container = styled.div<Partial<ProgressBarProps>>`
 
  progress {
    margin-bottom: 0px;
  }

  progress[value] {
    width: ${props => props.width};

    -webkit-appearance: none;
    appearance: none;
  }

  progress[value]::-webkit-progress-bar {
    height: 2px;
    border-radius: 20px;
    background-color: #eee;
  }  

  progress[value]::-webkit-progress-value {
    height: 10px;
    border-radius: 20px;
    background-color: ${props => props.color};
  }
`;


export interface ProgressBarProps {
  value: number;
  max: number;
  width: string;
  loadingBarColor?: string;
}

 