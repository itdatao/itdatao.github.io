getAbstract();

/**
 * 截取摘要
 */
function getAbstract() {
    let posts = document.getElementById('posts');

    if (document.getElementsByTagName('article').length <= 1) {
        console.log("不在主页！");
        return ;
    }

    let arts = posts.getElementsByClassName("post-body");
    for (let i = 0; i < arts.length; i++) {
        let dom = arts[i];
        let content = dom.innerText
            .substring(0, 250)  + "......";

        let readAll = dom.getElementsByClassName("post-button")[0];
        dom.innerHTML = content;
        dom.appendChild(readAll);
    }
}
