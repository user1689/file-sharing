import React, { ChangeEvent, createRef, useRef, useState } from "react";
import { Button, Input, Space } from "antd";
import styled from "@emotion/styled";
import { DownloadOutlined } from "@ant-design/icons";
import AWS from "aws-sdk";
import axios from 'axios';

const accessKeyId = process.env.REACT_APP_S3_KEY;
const secretAccessKey = process.env.REACT_APP_S3_VALUE;

export const DownLoadComponent = () => {
    const [param, setParam] = useState("");
    const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
        setParam(e.target.value);
    };
    const handleDownLoad = () => {
        if (param.length == 0) return; 

        const S3_BUCKET = "team4-file";
        const REGION = "us-west-1";

        AWS.config.update({
            accessKeyId,
            secretAccessKey,
        });

        const myBucket = new AWS.S3({
            params: { Bucket: S3_BUCKET },
            region: REGION,
        });

        const getObjectParams = {
            Bucket: S3_BUCKET,
            Key: param,
        };

        // myBucket.getObject(getObjectParams, async function (err, data) {
        //     if (err) {
        //         console.log("Error getting object: ", err);
        //     } else {
        //         console.log(
        //             "Object retrieved successfully. Content: ",
        //             data.Body?.toString()
        //         );
        //     }
        // });

         axios({
            url : myBucket.getSignedUrl("getObject", getObjectParams),
            method: 'GET',
            responseType: 'blob'
        }).then((res) => {
            const blob = new Blob([res.data], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = param;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }).catch((err) => {
            alert("file does not exists");
        });

    };
    return (
        <>
            <Space wrap>
                <MyInput value={param} onChange={(e) => handleInput(e)} placeholder="Enter your link for dowload"></MyInput>
                <MyButton
                    type="link"
                    icon={<DownloadOutlined />}
                    onClick={handleDownLoad}
                ></MyButton>
            </Space>
        </>
    );
};

const MyInput = styled(Input)`
    border-radius: 0px;
    width: 240px;
`;

const MyButton = styled(Button)`
    color: #ade6e6;
`;
