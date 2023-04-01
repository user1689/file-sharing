import styled from "@emotion/styled";
import axios, { AxiosRequestHeaders } from "axios";
import React, { ReactNode, useRef, useState } from "react";
import { Dragger } from "./Dragger";
import { UploadList } from "./UploadList";
import AWS from "aws-sdk";

const accessKeyId = process.env.REACT_APP_S3_KEY;
const secretAccessKey = process.env.REACT_APP_S3_VALUE;

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
    beforeUpload?: (file: File) => boolean | Promise<File>;
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
        action,
        onProgress,
        beforeUpload,
        onSuccess,
        onError,
        onChange,
        onRemove,
        name,
        data,
        headers,
        withCredentials,
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
                post(file);
            } else {
                const result = beforeUpload(file);
                if (result && result instanceof Promise) {
                    result.then((processedFile) => post(processedFile));
                } else if (result === true) {
                    post(file);
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
    const post = async (file: File) => {
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

        const formData = new FormData();
        formData.append(name || "file", file);
        if (data) {
            Object.keys(data).forEach((key) => {
                formData.append(key, data[key]);
            });
        }
        // axios
        //     .post(action, formData, {
        //         headers: {
        //             ...headers,
        //             "Content-Type": "multipart/form-data",
        //         },
        //         withCredentials,
        //         onUploadProgress: (e) => {
        //             let precentage =
        //                 Math.round((e.loaded * 100) / e.total) || 0;
        //             if (precentage < 100) {
        //                 updateFileInFileList(_file, {
        //                     precentage,
        //                     status: "uploading",
        //                 });
        //             }
        //         },
        //     })
        //     .then((resp) => {
        //         updateFileInFileList(_file, {
        //             precentage: 100,
        //             status: "success",
        //             resp,
        //         });
        //         if (onSuccess) {
        //             onSuccess(resp.data, file);
        //         }
        //     })
        //     .catch((err) => {
        //         updateFileInFileList(_file, {
        //             precentage: 100,
        //             status: "error",
        //             err,
        //         });
        //         if (onError) {
        //             onError(err, file);
        //         }
        //     })
        //     .finally(() => {
        //         if (onChange) {
        //             onChange(file);
        //         }
        //     });

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

        const params = {
            ACL: "public-read",
            Body: file,
            Bucket: S3_BUCKET,
            Key: file.name,
        };

        const upload = myBucket.putObject(params);

        upload.on("httpUploadProgress", function (progress: any) {
            console.log("Progress:", progress.loaded, "/", progress.total);
            let precentage =
                Math.round((progress.loaded * 100) / progress.total) || 0;
            if (precentage < 100) {
                updateFileInFileList(_file, {
                    precentage,
                    status: "uploading",
                });
            }
        });

        upload.send((err: any, data: any) => {
            if (err) {
                console.log(err);

                updateFileInFileList(_file, {
                    precentage: 100,
                    status: "error",
                    err,
                });
                if (onError) {
                    onError(err, file);
                }
            } else {
                console.log("Upload completed successfully!");
                console.log("Response data:", data);

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
 
