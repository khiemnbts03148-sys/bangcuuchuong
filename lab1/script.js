function showme(section) {

    let content = "";

    if (section == "about") {

        content = `
            <h2>Tôi là ai?</h2>

            <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3">

            <h3>Xin chào!</h3>

            <p>Tôi là sinh viên ngành Công nghệ thông tin.</p>

            <p>Tôi yêu thích lập trình và thiết kế website.</p>
        `;

    }

    if (section == "nganh") {

        content = `
            <h2>Chuyên ngành</h2>

            <h3>Công nghệ thông tin</h3>

            <p>Tôi đang học ngành Công nghệ thông tin.</p>

            <ul>
                <li>HTML & CSS</li>
                <li>Lập trình Java</li>
                <li>Cơ sở dữ liệu</li>
                <li>Lập trình Web</li>
            </ul>
        `;

    }

    if (section == "tiendo") {

        content = `
            <h2>Tiến độ đào tạo</h2>

            <h3>Học kỳ 1</h3>
            <p>HTML & CSS</p>
            <p>Lập trình cơ bản</p>

            <h3>Học kỳ 2</h3>
            <p>Lập trình Java</p>
            <p>Cơ sở dữ liệu</p>

            <h3>Học kỳ 3</h3>
            <p>Lập trình Web</p>
        `;

    }

    document.getElementById("showme").innerHTML = content;
}
 