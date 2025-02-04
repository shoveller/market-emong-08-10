import PocketBase from 'pocketbase';
import '/src/styles/tailwind.css';
import { getPbImageURL, pb, comma } from '/src/lib/';

/* -------------------------------------------------------------------------- */
/*                                  toggle                                    */
/* -------------------------------------------------------------------------- */

document.querySelectorAll('.cart-toggle').forEach(function (toggle) {
  toggle.addEventListener('click', function () {
    const cartProduct = this.nextElementSibling;
    const toggleIcon = this.querySelector('.toggle-icon');

    if (cartProduct.style.display === 'none') {
      cartProduct.style.display = 'block';
      toggleIcon.classList.remove('rotate-180');
    } else {
      cartProduct.style.display = 'none';
      toggleIcon.classList.add('rotate-180');
    }
  });
});

/* -------------------------------------------------------------------------- */
/*                            cart product list                               */
/* -------------------------------------------------------------------------- */
const currentUserData = JSON.parse(localStorage.getItem('userAuth'));

const userId = currentUserData.user.id;

const userCarts = await pb.collection('cart').getFullList({
  filter: `userId = "${userId}"`,
});

/**
 * TODO: forEach 로 부수효과를 만들지 마시고 Array.prototype.map 사용을 고려해 보세요.
 * @type {{productId: *, count: *, userId: *}[]}
 */
const cartData = userCarts.map((userCart) => {
  return {
    userId: userCart.userId,
    productId: userCart.productId,
    count: userCart.count,
  };
});

console.log(cartData);

const cartListCharacter = document.querySelector('.product-list-character');
const cartListTool = document.querySelector('.product-list-tool');
// const cartCharacter = document.querySelector('.category-character');
// const cartTool = document.querySelector('.category-tool');

// 상품 목록 (상품 데이터)
for await (const data of cartData) {
  const productData = await pb.collection('product').getOne(data.productId);

  createProductHTML(productData);
}

function createProductHTML({
  collectionId,
  id,
  category,
  photo,
  brand,
  name,
  discount,
  price,
}) {
  // console.log(category);
  const discountPrice = price - (price * discount) / 100;

  // 장바구니 상품 목록
  const cartTemplate = /* html */ `
    <ul class="product flex items-center justify-around py-3 border-b border-gray-200">
      <li>
        <label for="product-select">
        <input
          type="checkbox"
          id="product-select"
          name="product-select"
          class=" product-checkbox h-5 w-5 appearance-none bg-unchecked-icon bg-cover bg-center bg-no-repeat checked:bg-checked-icon"
          checked
          />
        </label>
      </li>
      <li class="flex items-center gap-1">
        <!-- 상품이미지 -->
        <span>
          <img
            src="${getPbImageURL(collectionId, id, photo)}"
            alt="${name}"
            class="h-73pxr w-63pxr border border-gray-200 p-1"
          />
        </span>
        <!-- 상품이름 -->
        <span class="w-325pxr font-bold">
          [${brand}]${name}
        </span>
      </li>
      <!-- 상품갯수 추가, 감소 버튼 -->
      <li
        class="product-count flex justify-between w-90pxr h-30pxr items-center border border-gray-200"
      >
        <button
          type="button"
          class="minus-button h-7 w-7 bg-minus-icon bg-cover bg-center bg-no-repeat hover:bg-slate-200"
          aria-label="수량감소"
          disabled
        >
        </button>
        <span class="count">1</span>
        <button
          type="button"
          class="plus-button h-7 w-7 bg-plus-icon bg-cover bg-center bg-no-repeat hover:bg-slate-200"
          aria-label="수량증가"
        >
        </button>
      </li>
      <li class="flex flex-col w-130pxr text-end">
        <!-- 상품금액 -->
        <span class="discount-price text-right font-bold"> ${comma(
          discountPrice
        )}원 </span>
        <span class="cost-price line-through text-right text-sm text-gray-400"> ${comma(
          price
        )}원 </span>
      </li>
      <li>
        <!-- 삭제 -->
        <button
          type="button"
          class="delete-button h-8 w-7 bg-delete-icon bg-cover bg-center bg-no-repeat"
          aria-label="상품삭제"
        >
        </button>
      </li>
    </ul>
  `;

  if (category === '캐릭터') {
    // cartCharacter.classList.remove('hidden');
    // cartCharacter.classList.add('block');
    cartListCharacter.insertAdjacentHTML('afterbegin', cartTemplate);
  } else if (category === '도구') {
    // cartTool.classList.remove('hidden');
    // cartTool.classList.add('block');
    cartListTool.insertAdjacentHTML('afterbegin', cartTemplate);
  }
}

// 상품 삭제 (임시)
cartListCharacter.addEventListener('click', function (event) {
  if (event.target.classList.contains('delete-button')) {
    const product = event.target.closest('.product');
    if (product) {
      cartListCharacter.removeChild(product);
    }
  }
});

cartListTool.addEventListener('click', function (event) {
  if (event.target.classList.contains('delete-button')) {
    const product = event.target.closest('.product');
    if (product) {
      cartListTool.removeChild(product);
    }
  }
});

/* -------------------------------------------------------------------------- */
/*                                   checkbox                                 */
/* -------------------------------------------------------------------------- */
/**
 * TODO: form 의 onchange 이벤트 핸들러로 수정할 수 있을거에요.
 * @type {NodeListOf<Element>}
 */
const selectAllCheckboxes = document.querySelectorAll(
  'input[id^="selected-all"]'
);
const productCheckboxes = document.querySelectorAll(
  'input[name="product-select"]'
);
const checkedCount = document.querySelectorAll('.checked-count');

selectAllCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', function () {
    productCheckboxes.forEach((productCheckbox) => {
      productCheckbox.checked = this.checked;
    });
    SelectAllCheckboxes(this.checked);
    updateCheckedCount();
  });
});

productCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', function () {
    const isAllSelected = Array.from(productCheckboxes).every(
      (productCheckbox) => productCheckbox.checked
    );
    SelectAllCheckboxes(isAllSelected);
    updateCheckedCount();
  });
});

function SelectAllCheckboxes(checked) {
  selectAllCheckboxes.forEach((checkbox) => {
    checkbox.checked = checked;
  });
}

// 선택한 상품 갯수
function updateCheckedCount() {
  const checkedItemsCount = document.querySelectorAll(
    'input[name="product-select"]:checked'
  ).length;
  checkedCount.forEach(function (element) {
    element.textContent = checkedItemsCount;
  });
}

updateCheckedCount();

// 전체 상품 갯수
let productSelectCount = document.querySelectorAll(
  'input[name="product-select"]'
).length;
let checkedAllCount = document.querySelectorAll('.checked-all-count');

checkedAllCount.forEach(function (element) {
  element.textContent = productSelectCount;
});

/* -------------------------------------------------------------------------- */
/*                               수량, 금액 변경                                */
/* -------------------------------------------------------------------------- */

const minusButtons = Array.from(document.querySelectorAll('.minus-button'));
const plusButtons = Array.from(document.querySelectorAll('.plus-button'));

function changeAmount(e) {
  e.preventDefault();

  const isPlusButton = e.target.classList.contains('plus-button');
  const targetProduct = e.target.closest('.product');
  const targetCountElement = targetProduct.querySelector('.count');
  const priceElement = targetProduct.querySelector('.discount-price');
  const costPriceElement = targetProduct.querySelector('.cost-price');

  let currentCount = parseInt(targetCountElement.textContent); // 수량
  let discountPrice = parseInt(
    targetProduct.dataset.discountPrice?.replace(/,/g, '')
  ); // 할인금액
  let costPrice = parseInt(targetProduct.dataset.costPrice?.replace(/,/g, '')); // 원래금액

  // 상품 금액
  if (!discountPrice) {
    discountPrice = parseInt(priceElement.textContent.replace(/,/g, ''));
    targetProduct.dataset.discountPrice = discountPrice;
  }

  if (!costPrice) {
    costPrice = parseInt(costPriceElement.textContent.replace(/,/g, ''));
    targetProduct.dataset.costPrice = costPrice;
  }

  // 상품 수량
  if (!isPlusButton && currentCount > 1) {
    currentCount -= 1;
  } else if (isPlusButton) {
    currentCount += 1;
  }
  targetCountElement.textContent = currentCount;

  priceElement.innerText = `${comma(discountPrice * currentCount)}원`;
  costPriceElement.innerText = `${comma(costPrice * currentCount)}원`;

  const minusButton = targetProduct.querySelector('.minus-button');
  minusButton.disabled = currentCount === 1;
}

minusButtons.forEach((minusButton) => {
  minusButton.addEventListener('click', changeAmount);
});

plusButtons.forEach((plusButton) => {
  plusButton.addEventListener('click', changeAmount);
});

/* -------------------------------------------------------------------------- */
/*                                cart-side                                   */
/* -------------------------------------------------------------------------- */

async function userData() {
  // TODO: 변수 선언부와 사용처는 가까울수록 좋겠습니다.
  const userPrice = await pb.collection('users').getOne('6kki52fp9i5fmjy');
  const { address, price, discount } = userPrice;
  const discountPrice = price - (price * discount) / 100;
  const cartList = document.querySelector('.cart-side');

  // const allPrice = document.querySelectorAll('.discount-price');

  // let result = 0;
  // allPrice.forEach((price) => {
  //   result + beforeComma(price.innerText);
  // });

  const template = /* html */ `

    <div class="m-auto border p-5 ">
      <div class="flex items-center pb-3">
        <!-- <img src="/src/assets/cartPage/ic-location.svg" alt="배송지" /> -->
        <span class="h-7 w-7 bg-location-icon bg-no-repeat bg-center bg-cover"></span>
        <span>배송지</span>
      </div>
      <div class="pb-6">
        <!-- 로그인 유저 주소 데이터 랜더링 -->
        <h3>${address}</h3>
        <span class="text-bluemong text-xs font-bold">미래배송</span>
      </div>
      <button
        type="button"
        class="w-full font-bold rounded-lg border-2 border-skybluemong py-2 text-bluemong transition-all hover:bg-skybluemong hover:text-white"
      >
        배송지 변경
      </button>
    </div>

    <div class="bg-gray-50 p-5">
      <!-- 선택 상품 금액, 금액 합 랜더링 -->
      <div class="flex justify-between pb-4">
        <span>상품금액</span>
        <span>${comma(price)}원</span>
      </div>
      <div class="flex justify-between pb-4">
        <span>상품할인금액</span>
        <span> -${comma(discount)}원</span>
      </div>
      <div class="flex justify-between items-center pb-4">
        <span>배송비</span>
        <span class="text-bluemong text-sm">마켓에몽은 <strong>365일</strong> 언제나 무료배송!</span>
      </div>
      <!-- 금액의 총 합 -->
      <div class="flex justify-between border-t-2 py-4">
        <span>결제예정금액</span>
        <span>
          <strong>${comma(discountPrice)}</strong>
          <span>원</span>
        </span>
      </div>
      <div class="flex justify-end gap-1 text-xs">
        <span class="rounded-sm bg-orange-600 px-1 text-white"
          >적립</span
        >
        <span>로그인 후 회원 등급에 따라 적립</span>
      </div>
    </div>
  `;
  cartList.insertAdjacentHTML('afterbegin', template);
}
userData();
