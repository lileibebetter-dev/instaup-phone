declare module "ali-oss" {
  type PutOptions = {
    headers?: Record<string, string>;
  };

  type PutResult = {
    name: string;
    etag: string;
  };

  export default class OSS {
    constructor(opts: {
      region: string;
      bucket: string;
      accessKeyId: string;
      accessKeySecret: string;
    });

    put(objectKey: string, filePath: string, options?: PutOptions): Promise<PutResult>;
  }
}



