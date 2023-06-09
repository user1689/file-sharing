import { useState } from "react";
import { UploadComponent, UploadFile } from "./UploadComponent/UploadComponent";
import { DownLoadComponent } from "./DownLoadComponent/DownLoadComponent";
import { CloudUploadOutlined } from "@ant-design/icons";
import { WrapperFile } from "./types";
import "./index.css";
import { notification } from "antd";

function App() {
    const defaultFileList: UploadFile[] | undefined = [];

    const onProgress = (p: any, f: any) => {
    };
    const onSuccess = (resp: any, f: any) => {
        setKeyList((p) => {
            return [f.name, ...p];
        });
        notification.success({
            message: "Upload success",
        });
    };
    const onError = (e: any, f: any) => {
        console.log("err", e);
    };
    const onChange = (f: any) => {};
    const checkSize = (file: any) => {
        if (file && file instanceof File) {
            if (file.size / 1024 / 1024 / 1024 > 5) {
                notification.info({
                    message: "File size should smaller than 5GB",
                });
                return false;
            }
            return true;
        }
        return false;
    };
    const renameFile = (file: File) => {
        if (!checkSize(file)) {
            return false;
        }
        if (file && file instanceof File) {
            let newFile: File;
            if (file.name.length > 20) {
                const newFileName = file.name.substring(0, 20);
                newFile = new File([file], newFileName + "...", {
                    type: file.type,
                });
            } else {
                newFile = file;
            }
            const p = new Promise<WrapperFile>((res, rej) => {
                res({
                    file: newFile,
                    originalName: file.name,
                });
            });
            return p;
        }
        return false;
    };

    const [keyList, setKeyList] = useState<string[]>([]);

    const handleClick = (e: any) => {
        const key = localStorage.getItem(e.target.value) || "invalid url!!!";
        navigator.clipboard.writeText(key);
    };

    return (
        <div className="App">
            <div className="wrapper">
                <div className="top">
                    <DownLoadComponent />
                </div>
                <div className="bottom">
                    <div className="left">
                        <UploadComponent
                            defaultFileList={defaultFileList}
                            beforeUpload={renameFile}
                            onError={onError}
                            onProgress={onProgress}
                            onSuccess={onSuccess}
                            onChange={onChange}
                            multiple={true}
                            accept={"*"}
                            drag={true}
                            originalBorderColor={"white"}
                            dragOverBorderColor={"#ade6e6"}
                            loadingBarColor={"#ade6e6"}
                            dragOverBgColor={"#90909042"}
                            dropBoxWidth={"200px"}
                        >
                            <CloudUploadOutlined />
                            <p>Click or Drag file over to upload</p>
                        </UploadComponent>
                    </div>
                    <div className="right">
                        <span>"Click to copy your code for sharing"</span>
                        {keyList.map((e, k) => (
                            <span className="link-list" key={k}>
                                <input
                                    readOnly
                                    className="link"
                                    value={e}
                                    onClick={handleClick}
                                />
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
