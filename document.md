# API List
this DOC describes How to use AI-cloud-Server API.

---

## Auth API
the loging API will set credentials on your web, than you can fetch some API which require credentials.

### SignIn Api
---

POST - <ServerIP>/api/auth/login
 - if logging successful(Response.ok), set a cookie: `token` .

*Request* :
``` javascript
// header
{'Content-Type' : 'application/json'}

// body payLoad
{username, password}
```
- username : account
- password : password
  
*Response* :
> json data is responsed：
``` javascript
{token, message}
```
- token:    the jwt token set on cookies.
- errorMessage: the message server gives to client to display

---

POST - <ServerIP>/api/auth/signUp
 - if logging successful(Response.ok), set a cookie: `token` .

> this api used to singUp, if failed, errorMessage will be set, status code: 401.

*Request* :
``` javascript
// header
{'Content-Type' : 'application/json'}

// body payLoad: JSON
{account, password}
```
- username : account
- password : password
  
*Response* :
> json data is responsed：
``` javascript
{message}
```
- message: the message server gives to client to display

---


## FileSystem API
To use this FileSystem API, you should loging before fetch the following API.
Every `Fetch` should contains credentials - Cookie: `token` should be set.

---

GET - <ServerIP>/user/<userId>/<path>

*Request* :
url Rule :
  - ServerIP
: your backend serverIP
  - userId
: your fronted web should know Who is the curremt user
  - path
: a path is start with a 'root' token.


example-1:  current user is billy, you want to get `<RootPathOfServer>/billy`, than the URL is like the following.

    GET - http://localhost:3001/users/billy/root

- serverIP: http://localhost:3001
- uerId:    billy
- path:     root{>>dirName}

example-2:  current user is billy, you want to get `<RootPathOfServer>/billy/workspace1`, than the URL is like the following.

    GET - http://localhost:3001/users/billy/root>>workspace1

- serverIP: http://localhost:3001
- uerId:    billy
- path:     root>>workspace1

*Reseponse* :
>json data is responsed.
``` javascript
// an array contain's all files in the target dictionary.
[{name, type}]

```

- name: file name - input.txt, test.py ....
- type: type Of File - dir || file
---

POST - <ServerIP>/user/<userId>/<path>/upload
> 此api可以上傳檔案到指定目錄，並傳傳更新後的目錄

*Request* :
>url Rule :
  - ServerIP
: your backend serverIP
  - userId
: your fronted web should know Who is the curremt user
  - path
: a path is start with a 'root' token.

body :
> require a FormData, with at least one file, the `name` of key must be `uploadFile`.

header :
```
Content-Type: multipart/form-data 
```

*Response* :

>header :
```
Content-Type: apllication/json 
```

>body:
```javascript
// an array contain's all files in the target dictionary.
[{name, type}]
```
---

---

GET - <ServerIP>/user/<userId>/<path>/download
> 此api可以下載指定目錄的檔案

*Request* :
>url Rule :
  - ServerIP
: your backend serverIP
  - userId
: your fronted web should know Who is the curremt user
  - path
: a path is start with a 'root' token.

*Response*

>header:
```javascript
Content-Disposition: <file information>
```
> 此header請用下列方式取出檔案名稱：
```javascript
Response.headers.get('Content-Disposition').match(/"(.*)"/)[1];
```

>body: 
``` javascript
// 回傳 blob物件，請自行介接API完成下載，例如
response.blob()
.than(fileBlob=> {
  // proccess download
})
.catch(err=>{
  // display err message in consol
   console.log(err);
})

```

---

## Workspace API
this API set should be access after get the credentials by `SignIn API` 
> should has cokkies: `token`

---
### Create Workspace

POST - <ServerIP>/user/<userId>/management/api/createWorkspace

>url Rule :
  - ServerIP
: your backend serverIP
  - userId
: your fronted web should know Who is the curremt user

*Request*

header:
``` javascript
// head set
{'Content-Type' : 'application/json'}
```

body:
``` javascript
{WSName}
```
- WSName : the name of the new workspace

*Response*

``` javascript
{message}
```
- message : serverside message, you can display on web.

---

### SetWorkspaceConfig

POST - <ServerIP>/user/<userId>/management/api/SetWorkspaceConfig/<workspaceName>

>url Rule :
  - `ServerIP`
: your backend serverIP
  - `userId`
: your fronted web should know Who is the curremt user
  -  `workspaceName`
: the workspace under the `userId`, which config you want to fetch.

*Request*

header:
``` javascript
// head set
{'Content-Type' : 'application/json'}
```

body:
``` javascript
{
  tensorflowVersion,
  GpuNum
}
```
- tensorflowVersion : a string represent tensorflow version.
- GpuNum : a Number represent number of Gpu (非負整數)


*Response*
header:
``` javascript
// head set
{'Content-Type' : 'application/json'}
```

body:

``` javascript
{message}

```
- message : serverside message, you can display on web.

---

### getWorkspaceConfig

GET - <ServerIP>/user/<userId>/management/api/getWorkspaceConfig/<workspaceName>


*Request*

header:
``` javascript
// head set
// None
```

body:
``` javascript
// None
```

*Response*
header:
``` javascript
// head set
{'Content-Type' : 'application/json'}
```

``` javascript
{
  tensorflowVersion,
  GpuNum
}

```
- tensorflowVersion : a string represent tensorflow version.
- GpuNum : a Number represent number of Gpu (非負整數)

---

### SetWorkspaceSchedulList

POST - <ServerIP>/user/<userId>/management/api/SetWorkspaceSchedulList/<workspaceName>


*Request*

header:
``` javascript
// head set
{ 'Content-Type' : 'application/json'}
```

body:
``` javascript
{scheduleList}
```

- scheduleList : an `array` of path represent each file ypu want to schdule in this workspace.

> pathRule:
```
workspace
|__ underWorkspaceRootDir.txt
|__ test.dir
          |__fileInTestDir.txt
```
> if you wnat to add `fileInTestDir.txt` `underWorkspaceRootDir.txt` into scheduleList.
> the object should looks like the following:
```javascript
{
  scheduleList: [
    'underWorkspaceRootDir.txt',
    'test.dir/fileInTestDir.txt'
  ]
}
```

*Response*
header:
``` javascript
// head set
{'Content-Type' : 'application/json'}
```

``` javascript
{
  scheduleList,
  message
}

```
- scheduleList : the new scheduleList updated by your request
- message : the serverside message you can show on the web

---


### getWorkspaceSchedulList

GET - <ServerIP>/user/<userId>/management/api/getWorkspaceSchedulList/<workspaceName>


*Request*

header:
``` javascript
// head set
// None
```

body:
``` javascript
// None
```

*Response*
header:
``` javascript
// head set
{'Content-Type' : 'application/json'}
```

``` javascript
{
  tensorflowVersion,
  GpuNum
}

```
- tensorflowVersion : a string represent tensorflow version.
- GpuNum : a Number represent number of Gpu (非負整數)

---
  

