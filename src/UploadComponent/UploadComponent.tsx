import React, { ReactNode, useRef, useState } from "react";
import axios, { AxiosRequestHeaders } from "axios";
import { Dragger } from "./Dragger";
import { UploadList } from "./UploadList";
import { v4 as uuid } from "uuid";
import { WrapperFile } from "../types";
import { notification } from "antd";
import AWS from "aws-sdk";

const accessKeyId = process.env.REACT_APP_S3_KEYID || "";
const secretAccessKey = process.env.REACT_APP_S3_ACCESSKEY || "";
const s3_bucket = process.env.REACT_APP_S3_BUCKET || "";
const region = process.env.REACT_APP_S3_REGION || "";

if (
    s3_bucket === "" ||
    region === "" ||
    accessKeyId === "" ||
    secretAccessKey === ""
)
    console.log("please config aws s3 env at first!");

export type UploadFileStatus = "ready" | "uploading" | "success" | "error";

export interface UploadFile {
    fid: string;
    size: number;
    name: string;
    status?: UploadFileStatus;
    precentage?: number;
    raw: File;
    resp?: any;
    err?: any;
}

export interface UploadProps {
    action?: string;
    onProgress?: (precentage: number, file: File) => void;
    beforeUpload?: (file: File) => boolean | Promise<WrapperFile>;
    onSuccess?: (data: any, file: File) => void;
    onError?: (error: any, file: File) => void;
    onChange?: (file: File) => void;
    onRemove?: (file: UploadFile) => void;
    defaultFileList?: UploadFile[];
    headers?: AxiosRequestHeaders;
    name?: string;
    data?: { [key: string]: any };
    withCredentials?: boolean;
    accept?: string;
    multiple?: boolean;
    drag?: boolean;
    children: ReactNode;
    originalBorderColor?: string;
    dragOverBorderColor?: string;
    loadingBarColor?: string;
    dragOverBgColor?: string;
    dropBoxWidth?: string;
}

export const UploadComponent: React.FunctionComponent<UploadProps> = (
    props
) => {
    const {
        onProgress,
        beforeUpload,
        onSuccess,
        onError,
        onChange,
        onRemove,
        defaultFileList,
        accept,
        multiple,
        children,
        drag,
        originalBorderColor,
        dragOverBorderColor,
        loadingBarColor,
        dragOverBgColor,
        dropBoxWidth,
    } = props;
    const [fileList, setFileList] = useState<UploadFile[]>(
        defaultFileList || []
    );
    let upload: AWS.Request<AWS.S3.PutObjectOutput, AWS.AWSError>;
    const fileInput = useRef<HTMLInputElement>(null);
    const handleClick = () => {
        if (fileInput.current) {
            fileInput.current.click();
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) {
            return;
        }
        uploadFile(files);
        if (fileInput.current) {
            fileInput.current.value = "";
        }
    };
    const uploadFile = (files: FileList) => {
        Array.from(files).forEach((file) => {
            if (!beforeUpload) {
                post({
                    file: file,
                    originalName: file.name,
                });
            } else {
                const result = beforeUpload(file);
                if (result && result instanceof Promise) {
                    result.then((processedFile) => post(processedFile));
                } else if (result === true) {
                    post({
                        file: file,
                        originalName: file.name,
                    });
                }
            }
        });
    };
    const updateFileInFileList = (
        currentFile: UploadFile,
        updateVal: Partial<UploadFile>
    ) => {
        setFileList((previousFileList) => {
            return previousFileList.map((e) => {
                if (e.fid === currentFile.fid) {
                    return { ...e, ...updateVal };
                } else {
                    return e;
                }
            });
        });
    };
    const post = async (wFile: WrapperFile) => {
        const { file, originalName } = wFile;
        if (originalName.lastIndexOf(".") === -1) {
            notification.info({
                message: "Please add suffix to your file before upload it",
            });
            return;
        }
        let _file: UploadFile = {
            fid: Date.now() + "_",
            size: file.size,
            name: file.name,
            raw: file,
            status: "ready",
            precentage: 0,
        };
        setFileList((previousList) => {
            return [_file, ...previousList];
        });

        AWS.config.update({
            accessKeyId,
            secretAccessKey,
        });

        const myBucket = new AWS.S3({
            params: { Bucket: s3_bucket },
            region: region,
        });

        const uniqueId = uuid();
        const ext = originalName.substring(originalName.lastIndexOf(".") + 1);
        const value = btoa(uniqueId.slice(0, 8) + "." + ext);
        localStorage.setItem(file.name, value);

        const params = {
            ACL: "public-read",
            Body: file,
            Bucket: s3_bucket,
            Key: uniqueId.slice(0, 8) + "." + ext,
        };

        upload = myBucket.putObject(params);

        upload?.on("httpUploadProgress", function (progress: any) {
            let precentage =
                Math.round((progress.loaded * 100) / progress.total) || 0;
            if (precentage < 100) {
                updateFileInFileList(_file, {
                    precentage,
                    status: "uploading",
                });
            }
        });

        upload?.send((err: any, data: any) => {
            if (err) {
                updateFileInFileList(_file, {
                    precentage: 100,
                    status: "error",
                    err,
                });
                if (onError) {
                    onError(err, file);
                }
            } else {
                updateFileInFileList(_file, {
                    precentage: 100,
                    status: "success",
                    resp: data,
                });
                if (onSuccess) {
                    onSuccess(data, file);
                }
            }
        });
    };
    const handleDelete = (file: UploadFile) => {
        {
            /* TODO: Cancel upload */
        }
        setFileList((previousList) => {
            return fileList.filter((e) => {
                if (e.fid === file.fid) {
                    return false;
                } else {
                    return true;
                }
            });
        });
        if (onRemove) {
            onRemove(file);
        }
    };
    return (
        <>
            <div style={{ display: "inline-block" }} onClick={handleClick}>
                {drag ? (
                    <Dragger
                        originalBorderColor={originalBorderColor}
                        dragOverBorderColor={dragOverBorderColor}
                        dragOverBgColor={dragOverBgColor}
                        dropBoxWidth={dropBoxWidth}
                        onFile={(files) => uploadFile(files)}
                    >
                        {" "}
                        {children}{" "}
                    </Dragger>
                ) : (
                    children
                )}
                <input
                    accept={accept}
                    multiple={multiple}
                    style={{ display: "none" }}
                    type="file"
                    ref={fileInput}
                    onChange={handleFileChange}
                />
            </div>
            <UploadList
                loadingBarColor={loadingBarColor}
                fileList={fileList}
                handleDelete={handleDelete}
            />
        </>
    );
};
