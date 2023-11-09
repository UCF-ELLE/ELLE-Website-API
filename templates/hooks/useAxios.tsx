import { useState, useEffect } from 'react';

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export type UseAxiosProps = {
    url: string;
    method: 'get' | 'post' | 'put' | 'delete' | undefined;
    headers?: AxiosRequestConfig['headers'] | undefined;
    params?: AxiosRequestConfig['params'] | undefined;
    body?: AxiosRequestConfig['data'] | undefined;
    trigger?: boolean | undefined;
};

export type UseAxiosResponse<T> = {
    response: AxiosResponse<T> | undefined;
    error: any;
    loading: boolean;
    execute: () => Promise<void>;
};

export default function useAxios<T>(config: AxiosRequestConfig): UseAxiosResponse<T> {
    const [response, setResponse] = useState<AxiosResponse<T>>();
    const [error, setError] = useState<any>();
    const [loading, setLoading] = useState<boolean>(false);

    const fetchData = async (config: AxiosRequestConfig) => {
        setError(undefined);
        setLoading(true);
        try {
            const result = await axios.request(config);
            setResponse(result);
        }
        catch (error) {
            setError(error);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData(config)
    }, []);

    const handleRequest = () => fetchData(config)

    return { response, error, loading, execute: handleRequest };
}
